import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
} from '@chakra-ui/react';
import { ChakraLineChart } from '../../ui/chakra-chart';
import { PredictionData, ChartDataItem, Range, Ranges, TimeRangeOption, SensorType } from './types'; // Import from types.ts

interface PredictionChartContainerProps {
  processedChartData: ChartDataItem[];
  selectedRange: string;
  handleRangeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  selectedSensorType: string;
  setSelectedSensorType: (type: string) => void;
  ranges: Ranges;
  timeRangeOptions: TimeRangeOption[];
  sensorTypes: SensorType[];
  formatChartXAxis: (timeStr: string) => string;
  getPredictionRangeText: () => string;
  lastUpdated: Date; // For cache-busting the chart key
}

const PredictionChartContainer: React.FC<PredictionChartContainerProps> = ({
  processedChartData,
  selectedRange,
  handleRangeChange,
  selectedSensorType,
  setSelectedSensorType,
  ranges,
  timeRangeOptions,
  sensorTypes,
  formatChartXAxis,
  getPredictionRangeText,
  lastUpdated,
}) => {
  return (
    <Box bg="white" p={5} borderRadius="lg" boxShadow="md" mb={8}>
      <Flex justify="space-between" align="center" mb={5}>
        <Box width="250px" visibility="hidden">
          {/* Invisible spacer to balance layout */}
        </Box>

        <Heading
          as="h2"
          size="3xl" // Reverted from size="lg" to original "3xl"
          color="green.600"
          fontWeight="extrabold"
          letterSpacing="wide" // Reverted to original "wide"
          textAlign="center"
          width="auto"
          mx="auto"
        >
          Prediction Trends
        </Heading>

        <Box
          width="250px"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          p={3}
          bg="gray.50"
          boxShadow="sm"
        >
          <Text fontWeight="medium" fontSize="sm" mb={2} color="gray.700">Prediction Range:</Text>
          <select
            value={selectedRange}
            onChange={handleRangeChange}
            style={{
              backgroundColor: "#f7fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "0.375rem",
              padding: "0.5rem",
              fontSize: "0.875rem",
              outline: "none",
              width: "100%",
              cursor: "pointer",
              marginBottom: "8px"
            }}
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Text fontSize="sm" color="gray.700" textAlign="center">
            Showing: <strong>{getPredictionRangeText()}</strong>
          </Text>
        </Box>
      </Flex>

      <Box>
        <Flex 
          borderBottom="1px solid" 
          borderColor="gray.200" 
          mb={4}
          overflowX="auto"
          width="100%"
          position="relative"
          css={{
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            scrollbarWidth: 'none', // Hide scrollbar on Firefox
            msOverflowStyle: 'none', // Hide scrollbar on IE/Edge
            '&::-webkit-scrollbar': { // Hide scrollbar on Chrome/Safari
              display: 'none'
            }
          }}
        >
          <Flex minWidth="max-content" width="100%">
            {sensorTypes.map((type) => (
              <Box
                key={type.id}
                px={4}
                py={2}
                cursor="pointer"
                borderBottom={selectedSensorType === type.id ? "2px solid #38a169" : "none"}
                color={selectedSensorType === type.id ? "green.500" : "gray.600"}
                fontWeight={selectedSensorType === type.id ? "bold" : "normal"}
                onClick={() => setSelectedSensorType(type.id)}
                minWidth="120px"
                flexShrink={0}
              >
                {type.label}
              </Box>
            ))}
          </Flex>
        </Flex>

        <Box>
          {sensorTypes.map(type => (
            <Box
              key={type.id}
              display={selectedSensorType === type.id ? "block" : "none"}
            >
              <Box mb={2} textAlign="center">
                <Text fontWeight="medium" fontSize="sm" color={type.color}>
                  {type.label} ({type.unit}) / Date & Time
                </Text>
              </Box>
              <Box
                h="400px"
                w="100%"
                overflowX="hidden"
                className="chart-animation"
                key={`chart-container-${selectedRange}-${selectedSensorType}-${type.id}`}
              >
                <ChakraLineChart
                  key={`chart-${selectedRange}-${selectedSensorType}-${type.id}-${lastUpdated.getTime()}`}
                  data={processedChartData}
                  xAxisKey="timestamp"
                  yAxisKeys={[{
                    key: type.id,
                    color: type.color,
                    name: `${type.label} (${type.unit})`
                  }]}
                  height={380}
                  formatXAxis={formatChartXAxis}
                  referencePoints={[
                    {
                      y: ranges[type.id as keyof typeof ranges].ideal.min,
                      label: 'Min Ideal',
                      color: '#38A169',
                      strokeDasharray: '5 5'
                    },
                    {
                      y: ranges[type.id as keyof typeof ranges].ideal.max,
                      label: 'Max Ideal',
                      color: '#38A169',
                      strokeDasharray: '5 5'
                    }
                  ]}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PredictionChartContainer; 