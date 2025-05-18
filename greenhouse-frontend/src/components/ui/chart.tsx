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
import { filterValidChartData, formatChartTick } from '../../utils';

interface LineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; name: string }[];
  height?: number;
  formatXAxis?: (value: string) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisKey,
  yAxisKeys,
  height = 400,
  formatXAxis
}) => {

  const validData = useMemo(() => {
    return filterValidChartData(data, xAxisKey);
  }, [data, xAxisKey]);


  const formatTick = (value: string) => {
    if (!value) return '';
    
    try {
      if (formatXAxis) {
        return formatXAxis(value);
      }
      
      return formatChartTick(value);
    } catch (e) {
      return '';
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
        No valid data available for chart
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
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis 
          dataKey={xAxisKey} 
          tick={{ fontSize: 12 }} 
          tickMargin={10}
          tickFormatter={formatTick}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickMargin={10}
        />
        <Tooltip 
          formatter={(value, name) => [`${value}`, name]}
          labelFormatter={(label) => formatTick(label as string)}
        />
        <Legend />
        {yAxisKeys.map(({ key, color, name }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            name={name}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
