import React from 'react';
import { 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, 
  Tooltip, Legend, Sector
} from 'recharts';
import { useTheme } from '@mui/material/styles';

/**
 * Pie chart component using Recharts
 * 
 * @param {Object} props
 * @param {Array} props.data - Chart data
 * @param {string} props.dataKey - Key for segment values
 * @param {string} props.nameKey - Key for segment names
 * @param {Array<string>} props.colors - Array of colors for segments
 */
const PieChart = ({ 
  data, 
  dataKey = 'value', 
  nameKey = 'name', 
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']
}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = React.useState(-1);
  
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(-1);
  };
  
  const renderActiveShape = (props) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill
      // eslint-disable-next-line no-unused-vars
      // payload, percent, value are unused but kept for documentation purposes
    } = props;
  
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={50}
          dataKey={dataKey}
          nameKey={nameKey}
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}
        />
        <Legend 
          formatter={(value) => (
            <span style={{ color: theme.palette.text.primary }}>{value}</span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;