import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
} from '@chakra-ui/react';

import UpcomingReadingsGrid from './UpcomingPredictedValues/UpcomingReadingsGrid';
import RecommendedActions from './RecommendedActions/RecommendedActions';
import PredictionChartContainer from './PredictionChartContainer';
import UnderstandingPredictions from './UnderstandingYourPredictions/UnderstandingPredictions';
import { Ranges, TimeRangeOption, SensorType } from './types';

// Import the custom hook
import { usePredictions } from '../../../utils/usePredictions';

// Define ranges for each reading type for mocking purposes (SHARED)
// These are passed to components that need them for display purposes (e.g. ideal ranges text)
const rangesDisplay: Ranges = {
  temp: { min: 15, max: 35, ideal: { min: 22, max: 28 } },
  air_humidity: { min: 35, max: 75, ideal: { min: 50, max: 65 } },
  soil_humidity: { min: 30, max: 70, ideal: { min: 45, max: 60 } },
  co2_level: { min: 400, max: 1500, ideal: { min: 700, max: 1200 } },
  light_lux: { min: 0, max: 2000, ideal: { min: 800, max: 1800 } }
};

// Time range options for the prediction data (SHARED with PredictionChartContainer)
const timeRangeOptions: TimeRangeOption[] = [
  { value: '6h', label: 'Next 6 Hours' },
  { value: '12h', label: 'Next 12 Hours' },
  { value: '24h', label: 'Next 24 Hours' },
  { value: '3d', label: 'Next 3 Days' },
  { value: '7d', label: 'Next 7 Days' }
];

// Define the sensor types for tabs (SHARED with PredictionChartContainer)
const sensorTypes: SensorType[] = [
  { id: 'temp', label: 'Temperature', unit: '°C', color: '#ff6b6b' },
  { id: 'air_humidity', label: 'Air Humidity', unit: '%', color: '#4dabf7' },
  { id: 'soil_humidity', label: 'Soil Humidity', unit: '%', color: '#20c997' },
  { id: 'co2_level', label: 'CO2 Level', unit: 'ppm', color: '#845ef7' },
  { id: 'light_lux', label: 'Light', unit: 'lux', color: '#fcc419' }
];

const Predictions: React.FC = () => {
  const {
    predictionData,
    selectedRange,
    selectedSensorType,
    isLoading,
    error,
    lastUpdated,
    isGenerating,
    dataSource,
    messageText,
    messageType,
    isRefreshing,
    handleGeneratePredictions,
    handleRangeChange,
    setSelectedSensorType,
    processedChartData,
    currentReading,
    getReadingColor,
    getPredictionRangeText,
    generatedInsights,
    formatChartXAxis,
  } = usePredictions();

  return (
    <Box p={{ base: 4, md: 5 }} bg="gray.50" minH="100vh">
      <Flex
        direction="column"
        maxW="1400px"
        mx="auto"
        width="100%"
      >
        <Heading 
          as="h1" 
          fontSize={{ base: "2.75rem", md: "3.25rem" }}
          textAlign="center"
          width="100%"
          mx="auto"
          mb={8}
          pt={6}
          pb={6}
          fontWeight="extrabold"
          color="teal.600"
          letterSpacing="tight"
        >
          Sensor Predictions
        </Heading>
        
        {messageText && (
          <Box 
            p={4} 
            mb={4} 
            borderRadius="md" 
            bg={messageType === 'success' ? "green.50" : "red.50"} 
            color={messageType === 'success' ? "green.600" : "red.600"}
            border="1px solid"
            borderColor={messageType === 'success' ? "green.200" : "red.200"}
          >
            <Flex align="center">
              <Box as="span" mr={2} fontSize="xl">
                {messageType === 'success' ? '✅' : '⚠️'}
              </Box>
              <Text>{messageText}</Text>
            </Flex>
          </Box>
        )}
        
        {error && (
          <Box 
            p={4} 
            mb={4} 
            borderRadius="md" 
            bg="yellow.50" 
            color="yellow.700"
            border="1px solid"
            borderColor="yellow.200"
          >
            <Flex align="center">
              <Box as="span" mr={2} fontSize="xl">⚠️</Box>
              <Text>Error from API: {error}</Text>
            </Flex>
          </Box>
        )}
        
        <Flex 
          justify={{ base: "center", md: "space-between" }} 
          align="center" 
          mb={{ base: 4, md: 4 }}
          direction={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
        >
          <Box>
            <button
              disabled={isGenerating}
              onClick={handleGeneratePredictions}
              style={{
                backgroundColor: isGenerating ? '#68D391' : '#38A169',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span role="img" aria-label="Generate">🔄</span>
              {isGenerating ? "Generating..." : "Generate New Predictions"}
            </button>
          </Box>

          <Box>
            <Text fontSize="sm" color="gray.500" textAlign={{ base: "center", md: "right" }}>
              <Flex align="center" justify={{ base: "center", md: "flex-end" }}>
                <Box as="span" mr={1} fontSize="sm">
                  {isRefreshing ? "🔄" : "🕒"}
                </Box>
                Last updated: {lastUpdated.toLocaleTimeString()}
                {dataSource && <span> · Source: <Box as="span" fontWeight="medium">{dataSource}</Box></span>}
                {isRefreshing && 
                  <Box as="span" ml={2} color="green.500" fontWeight="medium">
                    Refreshing...
                  </Box>
                }
              </Flex>
            </Text>
          </Box>
        </Flex>
      
        {isLoading ? (
          <Flex justify="center" align="center" h="300px" direction="column">
            <Spinner size="xl" color="green.500" mb={4} />
            <Text color="gray.600">Loading prediction data...</Text>
          </Flex>
        ) : predictionData.length === 0 && dataSource !== 'error' && dataSource !== 'empty database' && dataSource !== 'no data' ? (
          <Flex justify="center" align="center" h="300px" direction="column">
            <Spinner size="xl" color="green.500" mb={4} />
            <Text color="gray.600">Loading prediction data...</Text>
          </Flex>
        ) : (predictionData.length === 0 || dataSource === 'empty database' || dataSource === 'no data') && !error ? (
          <Box p={6} bg="blue.50" color="blue.600" borderRadius="lg" textAlign="center" boxShadow="sm">
            <Box as="span" fontSize="3xl" mb={3} display="block">{(dataSource === 'empty database' || dataSource === 'no data') ? "🌱" : "⚠️"}</Box>
            <Text fontSize="lg" mb={2} fontWeight="medium">
              {dataSource === 'empty database' ? "Database is Empty" : "No predictions available yet"}
            </Text>
            <Text>
              {"Click \"Generate New Predictions\" to create prediction data for your greenhouse."}
            </Text>
          </Box>
        ) : error && predictionData.length === 0 ? (
           <Box p={6} bg="red.50" color="red.600" borderRadius="lg" textAlign="center" boxShadow="sm">
            <Box as="span" fontSize="3xl" mb={3} display="block">⚠️</Box>
            <Text fontSize="lg" mb={2} fontWeight="medium">
              Connection Error
            </Text>
            <Text>
              {`${error}. Please try again later or check your database connection.`}
            </Text>
          </Box>
        ) : (
          <>
            <UpcomingReadingsGrid 
              currentReading={currentReading}
              ranges={rangesDisplay}
              getReadingColor={getReadingColor} 
            />
            
            {currentReading && <RecommendedActions insights={generatedInsights} />}
            
            <PredictionChartContainer 
              processedChartData={processedChartData}
              selectedRange={selectedRange}
              handleRangeChange={handleRangeChange}
              selectedSensorType={selectedSensorType}
              setSelectedSensorType={setSelectedSensorType}
              ranges={rangesDisplay}
              timeRangeOptions={timeRangeOptions}
              sensorTypes={sensorTypes}
              formatChartXAxis={formatChartXAxis}
              getPredictionRangeText={getPredictionRangeText}
              lastUpdated={lastUpdated}
            />
            
            <UnderstandingPredictions />
          </>
        )}
      </Flex>
    </Box>
  );
};

export default Predictions;
