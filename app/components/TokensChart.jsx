"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/**
 * TokensChart Component
 * @param {Array} data - [{ date: '1 Oct', chatgpt: 900, gemini: 1800, total: 2700 }, ...]
 * @param {string} title - ชื่อกราฟ
 * @param {number} height - ความสูงของกราฟ (ค่าเริ่มต้น 350)
 */
export default function TokensChart({
  data = [],
  title = "สถิติการใช้ Tokens รายวัน",
  height = 350,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <div>
        <h3 style={{ fontWeight: "bold", fontSize: "18px", color: "#222" }}>
          {title}
        </h3>
      </div>

      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e2f",
              borderRadius: "6px",
              border: "none",
              color: "#fff",
            }}
            formatter={(value) => value.toLocaleString()}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, marginBottom: 10 }}
          />

          {/* เส้น 1: ChatGPT5 */}
          <Line
            type="monotone"
            dataKey="chatgpt"
            name="ChatGPT5"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 5, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />

          {/* เส้น 2: Gemini 2.5 Pro */}
          <Line
            type="monotone"
            dataKey="gemini"
            name="Gemini 2.5 Pro"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 5, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />

          {/* เส้น 3: รวม */}
          <Line
            type="monotone"
            dataKey="total"
            name="รวม"
            stroke="#c084fc"
            strokeWidth={2}
            dot={{ r: 5, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
