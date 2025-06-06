import React, { useContext, useEffect, useRef, useState } from 'react';
// import { EventsContext } from '../../providers/EventsProviders';
// import EventCard from '../EventsList/EventCard';

const TimelineCanvas = ({ events, filters }) => {
  // const { data, filters } = useContext(EventsContext);
  const canvasRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 50); // Initial canvas width based on window size

  // Category colors
  const categoryColors = {
    'Account Maintenance': '#c8450e', // Red
    'Trading Events': '#00a286', // Green
    'Tax Loss Harvesting': '#0090c2', // Blue
  };

  // parse and memoize timestamps
  const enriched = React.useMemo(() => {
    if (!events) return [];

    return events.map((e) => ({
      ...e,
      _when: new Date(e.eventDate.split('-').reverse().join('-')).getTime(),
    }));
  }, [events]);

  // compute min/max once
  const [tMin, tMax] = React.useMemo(() => {
    const times = enriched.map((e) => e._when);
    return [Math.min(...times), Math.max(...times)];
  }, [enriched]);

  const categories = [
    'Account Maintenance',
    'Trading Events',
    'Tax Loss Harvesting',
  ];

  // handle resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasWidth(window.innerWidth - 50); // Update canvas width based on window size
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize); // Clean up listener on unmount
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvasWidth;
    const H = canvas.height;
    const margin = { left: 180, right: 80, top: 80, bottom: 80 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    // map category to y
    const yFor = (cat) => {
      const idx = categories.indexOf(cat);
      return margin.top + (idx + 0.5) * (innerH / categories.length);
    };

    // draw
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    // y-axis
    ctx.beginPath();
    ctx.moveTo(150, margin.top - 60);
    ctx.lineTo(150, H - 60);
    ctx.stroke();

    // x-axis
    ctx.beginPath();
    ctx.moveTo(10, 300);
    ctx.lineTo(W - margin.right, 300); // Adjust x-axis to fit the dynamic width
    ctx.stroke();

    // year ticks
    ctx.strokeStyle = '#e7e7e7';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#333';

    const startYear = new Date(tMin).getFullYear();
    const endYear = new Date(tMax).getFullYear();

    let showText = filters?.order === 'Newest' ? startYear : endYear;

    for (let y = startYear; y <= endYear; y++) {
      const xpos =
        margin.left +
        ((new Date(y, 0, 1).getTime() - tMin) / (tMax - tMin)) * innerW;
      if (y != startYear) {
        ctx.beginPath();
        ctx.moveTo(xpos, margin.top - 40);
        ctx.lineTo(xpos, H - margin.bottom);
        ctx.stroke();
        if (filters?.order === 'Newest') {
          ctx.fillText(showText++, xpos, H - margin.bottom + 10);
        } else {
          ctx.fillText(showText--, xpos, H - margin.bottom + 10);
        }
      } else {
        if (filters?.order === 'Newest') {
          ctx.fillText(showText++, xpos + 20, H - margin.bottom + 10);
        } else {
          ctx.fillText(showText--, xpos + 20, H - margin.bottom + 10);
        }
      }
    }

    // category lines + labels
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    categories.forEach((cat) => {
      const y = yFor(cat);
      ctx.strokeStyle = categoryColors[cat];
      ctx.beginPath();
      ctx.moveTo(margin.left, y - 50);
      ctx.lineTo(W - margin.right, y - 50);
      ctx.stroke();
      ctx.fillText(cat, margin.left - 40, y - 50);
    });

    // plot dots
    enriched.forEach((e) => {
      let frac = (e._when - tMin) / (tMax - tMin);
      if (filters?.order === 'Oldest') frac = 1 - frac; // Reverse the position correctly here
      const x = margin.left + frac * innerW;
      const y = yFor(e.category);
      const isSel = selected && selected.id === e.id;

      // Draw hollow circle (unselected)
      if (!isSel) {
        ctx.fillStyle = '#fff'; // White for hollow (transparent fill)
        ctx.strokeStyle = categoryColors[e.category]; // Ring color based on category
        ctx.lineWidth = 3; // Border thickness
        ctx.beginPath();
        ctx.arc(x, y - 50, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Draw filled circle (selected)
        ctx.fillStyle = categoryColors[e.category]; // Category color fill
        ctx.beginPath();
        ctx.arc(x, y - 50, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // in‐canvas tooltip for selected
      if (isSel) {
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const titleWidth = ctx.measureText(e.title).width;
        ctx.fillText(e.title, x - titleWidth / 2, y - 100);

        const dateWidth = ctx.measureText(e.eventDate).width;
        ctx.fillText(e.eventDate, x - dateWidth / 2, y - 80); // Show date below title
      }

      // store for click detection
      e._cx = x;
      e._cy = y - 50;
    });

    // Add axis labels
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Years', W / 2, H - 30);
    ctx.save();
    ctx.translate(50, H / 12);
    ctx.fillText('Event Types', 30, -20);
    ctx.restore();

    ctx.font = 'normal 12px Arial';
  }, [filters, selected, enriched, tMin, tMax, canvasWidth]); // Add canvasWidth to the dependency array

  // handle click
  const onClick = (ev) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    let hit = null;
    enriched.forEach((e) => {
      const dx = mx - e._cx;
      const dy = my - e._cy;
      if (!hit && Math.hypot(dx, dy) < 7) hit = e;
    });
    if (hit) setSelected(hit);
    if (selected == hit) setSelected(null);
  };

  return (
    <div className="d-flex justify-content-center border">
      <canvas
        ref={canvasRef}
        width={canvasWidth} // Dynamic canvas width
        height={400} // Increased canvas height for better spacing
        style={{ border: '0px', cursor: 'pointer' }}
        onClick={onClick}
      />

      {/* {selected && <EventCard event={selected} />} */}
    </div>
  );
};

export default TimelineCanvas;
