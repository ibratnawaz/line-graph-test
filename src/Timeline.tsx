import React from "react";
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

// Example input data
const taxLoss = [
  { date: "July 16, 2024", id: "123123124" },
  // ... more items
];
const trading = [
  { date: "July 16, 2024", id: "123123124" },
  // ... more items
];
const maintenance = [
  { date: "July 16, 2024", id: "123123124" },
  // ... more items
];

export default function TimelineChart() {
  // parse timestamps
  const parseTs = (d) => new Date(d).getTime();

  // compute domain
  const allTs = [
    ...taxLoss.map((e) => parseTs(e.date)),
    ...trading.map((e) => parseTs(e.date)),
    ...maintenance.map((e) => parseTs(e.date)),
  ];
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const minTs = Math.min(...allTs) - ONE_DAY;
  const maxTs = Math.max(...allTs) + ONE_DAY;

  // baseline data for horizontal lines at y = 0,1,2
  const baselineTax = [
    { x: minTs, y: 0 },
    { x: maxTs, y: 0 },
  ];
  const baselineTrade = [
    { x: minTs, y: 1 },
    { x: maxTs, y: 1 },
  ];
  const baselineAccount = [
    { x: minTs, y: 2 },
    { x: maxTs, y: 2 },
  ];

  // scatter points
  const pointsTax = taxLoss.map((e) => ({ x: parseTs(e.date), y: 0, ...e }));
  const pointsTrade = trading.map((e) => ({ x: parseTs(e.date), y: 1, ...e }));
  const pointsAccount = maintenance.map((e) => ({
    x: parseTs(e.date),
    y: 2,
    ...e,
  }));

  // click handler
  const handleDotClick = (payload) => {
    // replace with your API call
    console.log("Clicked event:", payload.id, payload);
    // e.g. fetchDetails(payload.id)
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={baselineTax}
        margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
      >
        <CartesianGrid stroke="#eee" />

        <XAxis
          dataKey="x"
          type="number"
          domain={[minTs, maxTs]}
          tickFormatter={(ts) => new Date(ts).getFullYear()}
        />

        <YAxis
          dataKey="y"
          type="number"
          domain={[0, 2]}
          ticks={[0, 1, 2]}
          tickFormatter={(v) => ["Tax Loss", "Trading", "Maintenance"][v]}
        />

        {/* baselines */}
        <Line
          data={baselineTax}
          dataKey="y"
          stroke="#00B4F4"
          strokeWidth={2}
          dot={false}
        />
        <Line
          data={baselineTrade}
          dataKey="y"
          stroke="#3CB4AC"
          strokeWidth={2}
          dot={false}
        />
        <Line
          data={baselineAccount}
          dataKey="y"
          stroke="#FF7300"
          strokeWidth={2}
          dot={false}
        />

        {/* event dots */}
        <Scatter
          name="Tax Loss"
          data={pointsTax}
          fill="#00B4F4"
          onClick={({ payload }) => handleDotClick(payload)}
        />
        <Scatter
          name="Trading"
          data={pointsTrade}
          fill="#3CB4AC"
          onClick={({ payload }) => handleDotClick(payload)}
        />
        <Scatter
          name="Maintenance"
          data={pointsAccount}
          fill="#FF7300"
          onClick={({ payload }) => handleDotClick(payload)}
        />

        <Tooltip
          cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
          labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
          formatter={(value, name, props) => [props.payload.id, "ID"]}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
