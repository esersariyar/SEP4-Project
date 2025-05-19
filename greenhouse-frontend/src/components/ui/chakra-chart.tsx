import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Box,
  Flex,
  Text,
  Heading,
  Spinner,
  HStack,
  Badge
} from '@chakra-ui/react';
import { filterValidChartData, formatChartTick } from '../../utils';

interface ReferencePoint {
  y: number;
  label: string;
  color: string;
  strokeDasharray?: string;
}

interface ChakraLineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; name: string }[];
  height?: number;
  formatXAxis?: (value: string) => string;
  title?: string;
  isLoading?: boolean;
  referencePoints?: ReferencePoint[];
}

// Özel Referans Çizgileri Açıklaması bileşeni
const ReferencePointsLegend: React.FC<{ referencePoints: ReferencePoint[] }> = ({ referencePoints }) => {
  if (!referencePoints || referencePoints.length === 0) return null;
  
  return (
    <Flex flexWrap="wrap" gap={2} mb={2}>
      {referencePoints.map((point, index) => (
        <Badge 
          key={`ref-badge-${index}`}
          colorScheme="gray" 
          variant="outline"
          px={2} 
          py={1}
          borderRadius="md"
          display="flex" 
          alignItems="center"
        >
          <Box 
            w="12px" 
            h="3px" 
            bg={point.color} 
            mr={2} 
            display="inline-block"
            borderRadius="sm"
            style={{ 
              borderStyle: point.strokeDasharray ? 'dashed' : 'solid',
              borderWidth: point.strokeDasharray ? '1px' : '0px',
              borderColor: point.color
            }}
          />
          <Text>{point.label}</Text>
        </Badge>
      ))}
    </Flex>
  );
};

export const ChakraLineChart: React.FC<ChakraLineChartProps> = ({
  data,
  xAxisKey,
  yAxisKeys,
  height = 400,
  formatXAxis,
  title,
  isLoading = false,
  referencePoints = []
}) => {
  const validData = useMemo(() => {
    // Check if we actually have valid data in a deeper way
    const filteredData = filterValidChartData(data, xAxisKey);
    
    // Verify that at least one data point has values for each of the yAxisKeys
    return filteredData.filter(item => {
      return yAxisKeys.some(keyObj => {
        const value = item[keyObj.key];
        return value !== undefined && value !== null && !isNaN(Number(value));
      });
    });
  }, [data, xAxisKey, yAxisKeys]);

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

  if (isLoading) {
    return (
      <Box
        height={`${height}px`}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
        p={4}
      >
        <Flex justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Spinner size="xl" color="blue.500" mb={4} />
          <Text color="gray.600">Loading data...</Text>
        </Flex>
      </Box>
    );
  }

  if (validData.length === 0) {
    return (
      <Box
        height={`${height}px`}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
        p={4}
      >
        <Flex justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text fontSize="2xl" mb={3}>📊</Text>
          <Heading as="h4" size="md" mb={2} color="blue.500">No Data Found</Heading>
          <Text color="gray.600" textAlign="center" maxW="80%">
            No valid data points found in the selected time range. Try selecting a different time range.
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
      p={4}
      height={`${height + 50}px`}
    >
      {title && (
        <Heading as="h3" size="sm" mb={3} color="blue.500">
          {title}
        </Heading>
      )}
      
      <ReferencePointsLegend referencePoints={referencePoints} />
      
      <ResponsiveContainer width="100%" height={height - 10}>
        <RechartsLineChart
          data={validData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12, fill: "#4A5568" }} 
            tickMargin={10}
            tickFormatter={formatTick}
            angle={-30}
            textAnchor="end"
            height={60}
            stroke="#E2E8F0"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#4A5568" }} 
            tickMargin={10}
            stroke="#E2E8F0"
          />
          <Tooltip 
            formatter={(value, name) => [`${value}`, name]}
            labelFormatter={(label) => formatTick(label as string)}
            contentStyle={{ 
              backgroundColor: "white", 
              borderColor: "#E2E8F0",
              borderRadius: '8px'
            }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '10px'
            }}
          />
          {/* Referans çizgileri - etiketsiz */}
          {referencePoints && referencePoints.map((point, index) => (
            <ReferenceLine 
              key={`ref-line-${index}`}
              y={point.y} 
              stroke={point.color} 
              strokeDasharray={point.strokeDasharray || "3 3"} 
              strokeWidth={1.5}
            />
          ))}
          {yAxisKeys.map(({ key, color, name }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              name={name}
              strokeWidth={2.5}
              dot={{ r: 4, fill: color, strokeWidth: 1 }}
              activeDot={{ r: 7, strokeWidth: 1 }}
              isAnimationActive={true}
              animationDuration={500}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
}; 