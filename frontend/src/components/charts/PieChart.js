import React from 'react';
import { 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, 
  Tooltip 
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

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
  title,
  colors = ['#0088FE', '#00C49F', '#FFBB28'] 
}) => {
  const theme = useTheme();
  
  // Don't render if no data is provided
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Typography 
        variant="h6" 
        align="center" 
        sx={{ 
          fontWeight: 'bold',
          fontSize: '1.25rem',
          mb: 2
        }}
      >
        {title}
      </Typography>
      
      <Box sx={{ 
        height: 140, 
        width: '100%',
        position: 'relative',
        mb: 3
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              outerRadius={55}
              innerRadius={35}
              dataKey={dataKey}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                padding: '4px 8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Legend with squares and dollar amounts */}
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          pl: 3
        }}
      >
        {data.map((entry, index) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}
          >
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: colors[index % colors.length],
                mr: 1
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 'auto',
                minWidth: '70px',
                fontWeight: 500
              }}
            >
              {entry[nameKey]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ${entry[dataKey].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PieChart;