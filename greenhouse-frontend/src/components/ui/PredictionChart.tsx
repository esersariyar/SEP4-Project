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
import { 
  filterValidChartData, 
  formatChartTick, 
  calculateTickInterval 
} from '../../utils';

interface PredictionChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; name: string }[];
  height?: number;
  formatXAxis?: (value: string) => string;
  timeRange: string; // Time range as a prop
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  data,
  xAxisKey,
  yAxisKeys,
  height = 400,
  formatXAxis,
  timeRange
}) => {

  // Use utility function to filter valid data
  const validData = useMemo(() => {
    return filterValidChartData(data, xAxisKey);
  }, [data, xAxisKey]);

  // Format tick labels based on time range
  const formatTick = (value: string) => {
    if (!value) return '';
    
    try {
      // Use custom formatter if provided
      if (formatXAxis) {
        return formatXAxis(value);
      }
      
      // Use utility function to format chart ticks with time range
      return formatChartTick(value, timeRange);
    } catch (e) {
      return '';
    }
  };
  
  // Calculate the interval for X-axis ticks
  const tickInterval = useMemo(() => {
    return calculateTickInterval(validData.length, timeRange);
  }, [validData.length, timeRange]);

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
          interval={tickInterval}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickMargin={10}
          domain={['auto', 'auto']}
        />
        <Tooltip 
          formatter={(value, name) => [`${value}`, name]}
          labelFormatter={(label) => formatChartTick(label as string, timeRange)}
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
