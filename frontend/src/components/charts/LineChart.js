import React from 'react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '@mui/material/styles';

/**
 * Line chart component using Recharts
 * 
 * @param {Object} props
 * @param {Array} props.data - Chart data
 * @param {string} props.xKey - Key for X axis values
 * @param {string} props.yKey - Key for Y axis values
 * @param {string} props.color - Line color
 * @param {string} props.name - Name for the data series
 * @param {boolean} props.showGrid - Whether to show grid lines
 */
const LineChart = ({ 
  data, 
  xKey = 'name', 
  yKey = 'value', 
  color = '#1976d2', 
  name = '',
  showGrid = true
}) => {
  const theme = useTheme();
  
  // Format large numbers for tooltip
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
        <XAxis 
          dataKey={xKey} 
          stroke={theme.palette.text.secondary}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={formatYAxis}
          stroke={theme.palette.text.secondary}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value) => [`$${value.toFixed(2)}`, name || yKey]}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          name={name || yKey}
          stroke={color} 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;