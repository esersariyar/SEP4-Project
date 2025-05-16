import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface PredictionChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; name: string }[];
  height?: number;
  formatXAxis?: (value: string) => string;
  timeRange: string; // Add time range as a prop
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  data,
  xAxisKey,
  yAxisKeys,
  height = 400,
  formatXAxis,
  timeRange
}) => {

  const validData = useMemo(() => {
    return data.filter(item => {
      try {
        if (!item[xAxisKey]) return false;
        const date = new Date(item[xAxisKey]);
        return !isNaN(date.getTime());
      } catch (e) {
        return false;
      }
    });
  }, [data, xAxisKey]);

  // Format tick labels based on time range
  const formatTick = (value: string) => {
    if (!value) return '';
    
    try {
      // Use custom formatter if provided
      if (formatXAxis) {
        return formatXAxis(value);
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format based on time range
      if (timeRange === '6h') {
        // For short time ranges, just show hours and minutes
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeRange === '12h' || timeRange === '24h') {
        // For medium time ranges, show time with abbreviated format
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // For longer time ranges (3d, 7d), show date and time
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Error formatting tick:', e);
      return '';
    }
  };
  
  // Calculate the interval for X-axis ticks based on data length and time range
  const calculateTickInterval = (): number => {
    const dataLength = validData.length;
    
    // Adjust intervals based on time range to avoid overcrowding
    if (timeRange === '6h') {
      return Math.max(1, Math.floor(dataLength / 6)); // Show ~6 ticks for 6h
    } else if (timeRange === '12h') {
      return Math.max(1, Math.floor(dataLength / 8)); // Show ~8 ticks for 12h
    } else if (timeRange === '24h') {
      return Math.max(1, Math.floor(dataLength / 8)); // Show ~8 ticks for 24h
    } else if (timeRange === '3d') {
      return Math.max(1, Math.floor(dataLength / 9)); // Show ~9 ticks for 3d
    } else if (timeRange === '7d') {
      return Math.max(1, Math.floor(dataLength / 10)); // Show ~10 ticks for 7d
    }
    
    // Default fallback based on data length
    if (dataLength <= 12) return 1;
    if (dataLength <= 24) return 3;
    if (dataLength <= 48) return 6;
    if (dataLength <= 96) return 12;
    return 24;
  };

  // Get appropriate X-axis label based on time range
  const getXAxisLabel = (): string => {
    if (timeRange === '3d' || timeRange === '7d') {
      return 'Date & Time';
    }
    return 'Time';
  };

  // Format the tooltip time based on the time range
  const formatTooltipTime = (label: string) => {
    try {
      const date = new Date(label);
      
      // For longer ranges, show date and time
      if (timeRange === '3d' || timeRange === '7d') {
        return date.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For shorter ranges, show time with day if needed
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return label;
    }
  };

  if (validData.length === 0) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        border: '1px solid #eee',
        borderRadius: '8px',
        color: '#666',
        backgroundColor: '#f9f9f9'
      }}>
        No prediction data available for the selected time range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={validData}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 65, // Increased bottom margin for labels
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis 
          dataKey={xAxisKey} 
          tick={{ fontSize: 11, fill: '#333' }} 
          tickMargin={20}
          tickFormatter={formatTick}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={calculateTickInterval()}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickMargin={10}
          domain={['auto', 'auto']}
        />
        <Tooltip 
          formatter={(value, name) => [`${value}`, name]}
          labelFormatter={(label) => formatTooltipTime(label as string)}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '12px'
          }}
        />
        <Legend 
          verticalAlign="top"
          align="right"
          wrapperStyle={{
            paddingBottom: 10
          }}
        />
        {yAxisKeys.map(({ key, color, name }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            name={name}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}; 
