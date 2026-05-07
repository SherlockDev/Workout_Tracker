import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  Chest: "#10b981",
  Back: "#3b82f6",
  Shoulders: "#8b5cf6",
  Arms: "#f59e0b",
  Legs: "#ef4444",
  Core: "#06b6d4",
  Cardio: "#ec4899",
};

const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {value}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { muscle_group, count } = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <strong>{muscle_group}</strong>: {count} set{count !== 1 ? "s" : ""}
    </div>
  );
};

export default function BodyAreaChart({ data }) {
  if (!data.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: "#94a3b8", fontSize: 14 }}>
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="muscle_group"
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={85}
          labelLine={false}
          label={renderLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.muscle_group] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
