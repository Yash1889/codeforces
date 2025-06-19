import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function ProblemDistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="rating"
          tick={{ fontSize: 12 }}
          label={{ value: 'Problem Rating', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: 'Problems Solved', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value) => [`${value} problems`, 'Count']}
        />
        <Legend />
        <Bar
          dataKey="count"
          fill="#82ca9d"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ProblemDistributionChart; 