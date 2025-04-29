import React, { useState, useRef } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Scatter,
  Tooltip,
} from "recharts";

// Example input data (replace with your props or fetch)
const taxLoss = [{ date: "July 16, 2024", id: "123123124" }];
const trading = [{ date: "July 16, 2024", id: "123123124" }];
const maintenance = [{ date: "July 16, 2024", id: "123123124" }];

export default function TimelineChart() {
  const parseTs = (d) => new Date(d).getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // prepare all timestamps
  const allTs = [
    ...taxLoss.map((e) => parseTs(e.date)),
    ...trading.map((e) => parseTs(e.date)),
    ...maintenance.map((e) => parseTs(e.date)),
  ];
  const initialMin = Math.min(...allTs) - ONE_DAY;
  const initialMax = Math.max(...allTs) + ONE_DAY;
  const initialSpan = initialMax - initialMin;

  // Zoomable domain state
  const [domain, setDomain] = useState([initialMin, initialMax]);

  // Keep ref to initial span for radius calculations
  const initialSpanRef = useRef(initialSpan);

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const [low, high] = domain;
    const span = high - low;
    const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
    const mid = low + span / 2;
    const newSpan = span * zoomFactor;
    setDomain([mid - newSpan / 2, mid + newSpan / 2]);
  };

  // Generate baselines
  const baseline = (type) => [
    { x: domain[0], y: type },
    { x: domain[1], y: type },
  ];

  // Scatter points
  const toPoints = (arr, type) =>
    arr.map((e) => ({ x: parseTs(e.date), y: type, ...e }));
  const pointsTax = toPoints(taxLoss, 0);
  const pointsTrade = toPoints(trading, 1);
  const pointsAccount = toPoints(maintenance, 2);

  // Click handler
  const handleDotClick = (payload) => {
    console.log("Clicked:", payload.id, payload);
    // fetchDetails(payload.id)
  };

  // Determine dot radius based on zoom
  const getRadius = () => {
    const span = domain[1] - domain[0];
    const ratio = initialSpanRef.current / span;
    return Math.min(12, Math.max(4, ratio * 4));
  };

  // Custom dot shape with dynamic radius
  const ZoomDot = ({ cx, cy, payload, fill }) => (
    <circle
      cx={cx}
      cy={cy}
      r={getRadius()}
      fill={fill}
      stroke="#fff"
      strokeWidth={1}
      onClick={() => handleDotClick(payload)}
      style={{ cursor: "pointer" }}
    />
  );

  // Dynamic tick formatting
  const formatTick = (ts) => {
    const span = domain[1] - domain[0];
    const date = new Date(ts);
    if (span > 5 * 365 * ONE_DAY) {
      return date.getFullYear();
    }
    if (span > 60 * ONE_DAY) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    }
    return date.toLocaleDateString();
  };

  return (
    <div onWheel={handleWheel} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={baseline(0)}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <CartesianGrid stroke="#eee" />

          <XAxis
            dataKey="x"
            type="number"
            domain={domain}
            scale="time"
            tickFormatter={formatTick}
            tickCount={6}
          />

          <YAxis
            dataKey="y"
            type="number"
            domain={[0, 2]}
            ticks={[0, 1, 2]}
            tickFormatter={(v) => ["Tax Loss", "Trading", "Maintenance"][v]}
          />

          {/* Horizontal baselines */}
          <Line data={baseline(0)} dataKey="y" stroke="#00B4F4" dot={false} />
          <Line data={baseline(1)} dataKey="y" stroke="#3CB4AC" dot={false} />
          <Line data={baseline(2)} dataKey="y" stroke="#FF7300" dot={false} />

          {/* Event dots with dynamic size */}
          <Scatter
            name="Tax Loss"
            data={pointsTax}
            fill="#00B4F4"
            shape={ZoomDot}
          />
          <Scatter
            name="Trading"
            data={pointsTrade}
            fill="#3CB4AC"
            shape={ZoomDot}
          />
          <Scatter
            name="Maintenance"
            data={pointsAccount}
            fill="#FF7300"
            shape={ZoomDot}
          />

          <Tooltip
            cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
            labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
            formatter={(value, name, props) => [props.payload.id, "ID"]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
