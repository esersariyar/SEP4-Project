import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ChakraLineChart } from './ui/chakra-chart';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Badge,
  Icon
} from '@chakra-ui/react';

// Import specific components from Chakra UI
import { Card, CardBody } from '@chakra-ui/react';
import { Select } from '@chakra-ui/react';
import { Tabs } from '@chakra-ui/react';

// Prediction data interface for each sensor reading
interface PredictionData {
  id?: number;
  predicted_temp: number;
  predicted_air_humidity: number;
  predicted_soil_humidity: number;
  predicted_co2_level: number;
  predicted_light_lux: number;
  timestamp: string;
}

// Define ranges for each reading type for mocking purposes
const ranges = {
  temp: { min: 15, max: 35, ideal: { min: 22, max: 28 } },
  air_humidity: { min: 35, max: 75, ideal: { min: 50, max: 65 } },
  soil_humidity: { min: 30, max: 70, ideal: { min: 45, max: 60 } },
  co2_level: { min: 400, max: 1500, ideal: { min: 700, max: 1200 } },
  light_lux: { min: 0, max: 2000, ideal: { min: 800, max: 1800 } }
};

// Time range options for the prediction data
const timeRangeOptions = [
  { value: '6h', label: 'Next 6 Hours' },
  { value: '12h', label: 'Next 12 Hours' },
  { value: '24h', label: 'Next 24 Hours' },
  { value: '3d', label: 'Next 3 Days' },
  { value: '7d', label: 'Next 7 Days' }
];

// Define the sensor types for tabs
const sensorTypes = [
  { id: 'temp', label: 'Temperature', unit: '°C', color: '#ff6b6b' },
  { id: 'air_humidity', label: 'Air Humidity', unit: '%', color: '#4dabf7' },
  { id: 'soil_humidity', label: 'Soil Humidity', unit: '%', color: '#20c997' },
  { id: 'co2_level', label: 'CO2 Level', unit: 'ppm', color: '#845ef7' },
  { id: 'light_lux', label: 'Light', unit: 'lux', color: '#fcc419' }
];

const Predictions: React.FC = () => {
  // State for predictions
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>('24h');
  const [selectedSensorType, setSelectedSensorType] = useState<string>('temp');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('unknown');
  const [messageText, setMessageText] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Track if this is the first render
  const isFirstRender = useRef<boolean>(true);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Show a message
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessageText(text);
    setMessageType(type);
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessageText(null);
      setMessageType(null);
    }, 5000);
  };

  // Helper function to parse date strings consistently to UTC Date objects
  const parseDate = (dateStr: string): Date => {
    try {
      // Handle MySQL datetime format (YYYY-MM-DD HH:MM:SS)
      if (dateStr.includes(' ') && dateStr.indexOf('-') === 4 && dateStr.length === 19) {
        const isoUtcStr = dateStr.replace(' ', 'T') + 'Z';
        const date = new Date(isoUtcStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
        const parts = dateStr.split(' ');
        const dateParts = parts[0].split('-');
        const timeParts = parts[1].split(':');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        const second = parseInt(timeParts[2], 10);
        const utcDateFromParts = new Date(Date.UTC(year, month, day, hour, minute, second));
        if (!isNaN(utcDateFromParts.getTime())) {
          return utcDateFromParts;
        }
      }
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      console.warn(`Failed to parse date string: ${dateStr}, falling back to current date.`);
      return new Date();
    } catch (e) {
      console.error(`Error parsing date string: ${dateStr}`, e);
      return new Date();
    }
  };

  // Helper function to format X-axis labels for the chart (UTC formatting)
  const formatChartXAxis = useCallback((timeStr: string): string => {
    try {
      const date = parseDate(timeStr);
      if (isNaN(date.getTime())) {
        return 'Invalid';
      }
      // selectedRange is directly accessible here from the component's state
      if (['6h', '12h', '24h'].includes(selectedRange)) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        });
      } else { // For '3d', '7d', etc.
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        return `${month}/${day}`;
      }
    } catch (e) {
      console.error("Error formatting chart X-axis:", e, "Input:", timeStr);
      return 'Err';
    }
  }, [selectedRange, parseDate]); // Add dependencies for useCallback

  // Fetch prediction data from the API
  const fetchPredictions = useCallback(async (range = selectedRange) => {
    setError(null);
    try {
      // Set refreshing indicator
      setIsRefreshing(true);
      
      // Fetch prediction data
      const response = await fetch(`${API_URL}/api/predictions?range=${range}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if the database is empty
      if (data.empty === true) {
        setPredictionData([]);
        setDataSource('empty database');
      }
      // Update state if we have data
      else if (data.data && data.data.length > 0) {
        // Store the data directly without causing re-renders until we're ready
        const predictionsData = data.data;
        
        // Update state atomically to avoid multiple renders
        setPredictionData(predictionsData);
        setLastUpdated(new Date());
        
        if (data._source) {
          setDataSource(data._source);
        }
      } 
      // No data in response
      else {
        // Show error when no data is returned from the API
        throw new Error('No prediction data available. Please generate predictions first.');
      }
      
      setIsLoading(false);
      
      // Clear refreshing indicator after a short delay to make it visible
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (err) {
      // Show error instead of falling back to local mock data
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setPredictionData([]);
      setDataSource('error');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [API_URL]); // Remove selectedRange from dependencies to avoid causality issues

  // Convert range string to hours
  const getHoursFromRange = (range: string): number => {
    switch (range) {
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case '3d': return 72;
      case '7d': return 168;
      default: return 24;
    }
  };

  // Generate new prediction data
  const handleGeneratePredictions = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/predictions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${result.message || 'Unknown error'}`);
      }
      
      // Show a success message
      showMessage(result.message || "New predictions were generated successfully!", 'success');
      
      // Refresh data after generation
      fetchPredictions(selectedRange);
    } catch (err) {
      // Show error message
      const errorMessage = err instanceof Error ? err.message : "Failed to generate prediction data";
      setError(errorMessage);
      showMessage(errorMessage, 'error');
      setPredictionData([]);
      setDataSource('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    // First update the state
    setSelectedRange(newRange);
    // Then fetch new data
    fetchPredictions(newRange);
  }, [fetchPredictions]);

  // Initialize with API data
  useEffect(() => {
    // Initial data fetch when component mounts
    setIsLoading(true); 
    fetchPredictions(selectedRange);
    
    // Set up interval for refreshing data every 30 seconds
    const intervalId = setInterval(() => {
      fetchPredictions(selectedRange);
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchPredictions]); // Don't include selectedRange to prevent re-triggering

  // Add a separate effect to handle range changes
  useEffect(() => {
    // Skip the first render to avoid duplicate API calls
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Fetch data when range changes (after first render)
    fetchPredictions(selectedRange);
  }, [selectedRange, fetchPredictions]);

  // Process data for the chart based on selected sensor type and time range
  const processedChartData = useMemo(() => {
    if (!predictionData.length) return [];
    
    // parseDate is now defined in the component scope, accessible here if needed
    // but it's primarily used by formatChartXAxis which is passed to the chart.
    // The direct parsing for 'ms' and 'parsedDate' for sorting/filtering should still happen here.

    const internalParseDateForSort = (dateStr: string): Date => {
        // This is a simplified local parser if needed, or just use the main `parseDate`
        // For sorting and filtering, we primarily need a valid Date object.
        // The main `parseDate` (now in component scope) ensures UTC interpretation.
        return parseDate(dateStr); 
    };

    const processedData = predictionData
      .map(item => {
        const parsedDt = internalParseDateForSort(item.timestamp); // Use the correctly scoped parseDate
        return {
          ...item,
          parsedDate: parsedDt, // Store the Date object
          timestamp: item.timestamp, // Keep original string for x-axis key if chart expects string
          ms: parsedDt.getTime()
        };
      })
      .sort((a, b) => a.ms - b.ms);
      
    // Get the hours for the selected range
    const hours = getHoursFromRange(selectedRange);
    
    // Use current time as the starting point, not the first data point
    const now = new Date();
    const endTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    // Filter data to selected time range
    const nowMs = now.getTime();
    const endTimeMs = endTime.getTime();
    
    // Only include points within our time window (current time to end of selected range)
    const filteredData = processedData.filter(item => {
      return item.ms >= nowMs && item.ms <= endTimeMs;
    });
    
    // Map to chart format
    return filteredData.map(item => ({
      timestamp: item.timestamp,
      date: item.parsedDate, // Keep date object for easier debugging
      [selectedSensorType]: selectedSensorType === 'temp' 
        ? item.predicted_temp 
        : selectedSensorType === 'air_humidity' 
          ? item.predicted_air_humidity 
          : selectedSensorType === 'soil_humidity' 
            ? item.predicted_soil_humidity 
            : selectedSensorType === 'co2_level' 
              ? item.predicted_co2_level 
              : item.predicted_light_lux
    }));
  }, [predictionData, selectedSensorType, selectedRange]);

  // Get the current sensor reading
  const currentReading = useMemo(() => {
    if (!predictionData.length) return null;
    return predictionData[0]; // First prediction is the closest to now
  }, [predictionData]);

  // Get the color for a reading based on its value
  const getReadingColor = (type: string, value: number): string => {
    const range = ranges[type as keyof typeof ranges];
    if (value < range.ideal.min || value > range.ideal.max) {
      return value < range.min || value > range.max ? '#e74c3c' : '#f39c12';
    }
    return '#2ecc71';
  };

  // Format the prediction range text
  const getPredictionRangeText = (): string => {
    if (!predictionData.length) return '';
    
    // Use current time as the starting point, not based on data
    const now = new Date();
    
    // Calculate end time based on selected range
    const selectedHours = getHoursFromRange(selectedRange);
    const endDate = new Date(now.getTime() + selectedHours * 60 * 60 * 1000);
    
    // Format the dates
    const startStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const startTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (startStr === endStr) {
      return `${startStr} ${startTimeStr} - ${endTimeStr}`;
    } else {
      return `${startStr} ${startTimeStr} - ${endStr} ${endTimeStr}`;
    }
  };

  // Generate insights based on predicted values
  const generatedInsights = useMemo(() => {
    if (!currentReading) return [];
    
    const insights = [];
    
    // Temperature insights
    if (currentReading.predicted_temp < ranges.temp.ideal.min) {
      insights.push({
        type: 'warning',
        icon: '🥶',
        message: 'Temperature is predicted to drop below ideal range. Consider heating options to protect plants.',
        sensor: 'temperature'
      });
    } else if (currentReading.predicted_temp > ranges.temp.ideal.max) {
      insights.push({
        type: 'warning',
        icon: '🔥',
        message: 'Temperature is predicted to rise above ideal range. Consider shade or cooling to prevent stress.',
        sensor: 'temperature'
      });
    } else {
      insights.push({
        type: 'success',
        icon: '👍',
        message: 'Temperature is predicted to stay in ideal range. Plants should thrive in these conditions.',
        sensor: 'temperature'
      });
    }
    
    // Air humidity insights
    if (currentReading.predicted_air_humidity < ranges.air_humidity.ideal.min) {
      insights.push({
        type: 'warning',
        icon: '💨',
        message: 'Air humidity is predicted to be low. Consider using a humidifier or misting plants.',
        sensor: 'air_humidity'
      });
    } else if (currentReading.predicted_air_humidity > ranges.air_humidity.ideal.max) {
      insights.push({
        type: 'warning',
        icon: '💧',
        message: 'Air humidity is predicted to be high. Improve air circulation to prevent fungal issues.',
        sensor: 'air_humidity'
      });
    } else {
      insights.push({
        type: 'success',
        icon: '👍',
        message: 'Air humidity is predicted to stay in ideal range. Good conditions for most plants.',
        sensor: 'air_humidity'
      });
    }
    
    // Soil humidity insights
    if (currentReading.predicted_soil_humidity < ranges.soil_humidity.ideal.min) {
      insights.push({
        type: 'warning',
        icon: '🚿',
        message: 'Soil is predicted to become dry. Plan to water your plants in the next few hours.',
        sensor: 'soil_humidity'
      });
    } else if (currentReading.predicted_soil_humidity > ranges.soil_humidity.ideal.max) {
      insights.push({
        type: 'warning',
        icon: '💦',
        message: 'Soil is predicted to be too wet. Hold off on watering and ensure proper drainage.',
        sensor: 'soil_humidity'
      });
    } else {
      insights.push({
        type: 'success',
        icon: '👍',
        message: 'Soil moisture is predicted to stay in ideal range. No watering adjustments needed.',
        sensor: 'soil_humidity'
      });
    }
    
    // CO2 level insights
    if (currentReading.predicted_co2_level < ranges.co2_level.ideal.min) {
      insights.push({
        type: 'warning',
        icon: '🌬️',
        message: 'CO2 levels are predicted to be low. Consider CO2 supplementation for better plant growth.',
        sensor: 'co2_level'
      });
    } else if (currentReading.predicted_co2_level > ranges.co2_level.ideal.max) {
      insights.push({
        type: 'warning',
        icon: '☁️',
        message: 'CO2 levels are predicted to be high. Improve ventilation for a better growing environment.',
        sensor: 'co2_level'
      });
    } else {
      insights.push({
        type: 'success',
        icon: '👍',
        message: 'CO2 levels are predicted to stay in ideal range. Excellent for photosynthesis.',
        sensor: 'co2_level'
      });
    }
    
    // Light lux insights
    if (currentReading.predicted_light_lux < ranges.light_lux.ideal.min) {
      insights.push({
        type: 'warning',
        icon: '🌑',
        message: 'Light levels are predicted to be low. Consider supplemental lighting for better growth.',
        sensor: 'light_lux'
      });
    } else if (currentReading.predicted_light_lux > ranges.light_lux.ideal.max) {
      insights.push({
        type: 'warning',
        icon: '☀️',
        message: 'Light levels are predicted to be high. Consider shading to prevent leaf burn.',
        sensor: 'light_lux'
      });
    } else {
      insights.push({
        type: 'success',
        icon: '👍',
        message: 'Light levels are predicted to stay in ideal range. Perfect for healthy plant growth.',
        sensor: 'light_lux'
      });
    }
    
    return insights;
  }, [currentReading]);

  return (
    <Box p={{ base: 4, md: 5 }} bg="gray.50" minH="100vh">
      <Flex
        direction="column"
        maxW="1400px"
        mx="auto"
        width="100%"
      >
        {/* Main Title */}
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
        
        {/* Show message */}
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
        
        {/* Show error */}
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

          {/* Data source and last updated indicator */}
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
        ) : predictionData.length === 0 ? (
          <Box p={6} bg={error ? "red.50" : "blue.50"} color={error ? "red.600" : "blue.600"} borderRadius="lg" textAlign="center" boxShadow="sm">
            <Box as="span" fontSize="3xl" mb={3} display="block">{error ? "⚠️" : "🌱"}</Box>
            <Text fontSize="lg" mb={2} fontWeight="medium">
              {error ? "Connection Error" : dataSource === 'empty database' ? "Database is Empty" : "No predictions available yet"}
            </Text>
            <Text>
              {error 
                ? `${error}. Please try again later or check your database connection.` 
                : dataSource === 'empty database'
                  ? "Click \"Generate New Predictions\" to create prediction data for your greenhouse."
                  : "Click \"Generate New Predictions\" to create prediction data for your greenhouse."
              }
            </Text>
          </Box>
        ) : (
          <>
            {/* Current predictions display with clear timeframe indicator */}
            {currentReading && (
              <Box 
                mb={8} 
                bg="white" 
                borderRadius="xl" 
                boxShadow="lg"
                overflow="hidden"
              >
                <Box 
                  bg="teal.600" 
                  p={4} 
                  color="white"
                  position="relative"
                >
                  <Flex 
                    align="center" 
                    justify="space-between"
                  >
                    <Flex align="center">
                      <Box as="span" fontSize="xl" mr={2}>⏱️</Box>
                      <Heading as="h2" size="md" fontWeight="bold">
                        Upcoming Predicted Values
                      </Heading>
                    </Flex>
                    <Badge 
                      colorScheme="teal" 
                      fontSize="md" 
                      px={3} 
                      py={1} 
                      borderRadius="full" 
                      bg="white" 
                      color="teal.700"
                    >
                      In 1 Hour
                    </Badge>
                  </Flex>
                </Box>
                
                {/* First row - 3 items */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} bg="white" p={4}>
                  <Box 
                    p={6} 
                    borderRadius="lg" 
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    position="relative"
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex align="center">
                        <Box 
                          as="span" 
                          mr={2} 
                          fontSize="xl" 
                          bg="red.100" 
                          color="red.500" 
                          p={1} 
                          borderRadius="md"
                        >
                          🌡️
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">Temperature</Text>
                      </Flex>
                      
                      <Box 
                        py={1} 
                        px={3} 
                        borderRadius="full"
                        bg={getReadingColor('temp', currentReading.predicted_temp) + '20'}
                        color={getReadingColor('temp', currentReading.predicted_temp)}
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {currentReading.predicted_temp < ranges.temp.ideal.min ? 'Too Cold' : 
                         currentReading.predicted_temp > ranges.temp.ideal.max ? 'Too Hot' : 'Optimal'}
                      </Box>
                    </Flex>
                    
                    <Flex align="baseline">
                      <Text 
                        fontSize="4xl" 
                        fontWeight="bold"
                        color={getReadingColor('temp', currentReading.predicted_temp)}
                        lineHeight="1"
                      >
                        {currentReading.predicted_temp}
                      </Text>
                      <Text 
                        fontSize="xl" 
                        color={getReadingColor('temp', currentReading.predicted_temp)}
                        ml={1}
                      >
                        °C
                      </Text>
                    </Flex>
                    
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Ideal range: {ranges.temp.ideal.min}-{ranges.temp.ideal.max}°C
                    </Text>
                  </Box>
                  
                  <Box 
                    p={6} 
                    borderRadius="lg" 
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex align="center">
                        <Box 
                          as="span" 
                          mr={2} 
                          fontSize="xl" 
                          bg="blue.100" 
                          color="blue.500" 
                          p={1} 
                          borderRadius="md"
                        >
                          💧
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">Air Humidity</Text>
                      </Flex>
                      
                      <Box 
                        py={1} 
                        px={3} 
                        borderRadius="full"
                        bg={getReadingColor('air_humidity', currentReading.predicted_air_humidity) + '20'}
                        color={getReadingColor('air_humidity', currentReading.predicted_air_humidity)}
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {currentReading.predicted_air_humidity < ranges.air_humidity.ideal.min ? 'Too Dry' : 
                         currentReading.predicted_air_humidity > ranges.air_humidity.ideal.max ? 'Too Humid' : 'Optimal'}
                      </Box>
                    </Flex>
                    
                    <Flex align="baseline">
                      <Text 
                        fontSize="4xl" 
                        fontWeight="bold"
                        color={getReadingColor('air_humidity', currentReading.predicted_air_humidity)}
                        lineHeight="1"
                      >
                        {currentReading.predicted_air_humidity}
                      </Text>
                      <Text 
                        fontSize="xl" 
                        color={getReadingColor('air_humidity', currentReading.predicted_air_humidity)}
                        ml={1}
                      >
                        %
                      </Text>
                    </Flex>
                    
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Ideal range: {ranges.air_humidity.ideal.min}-{ranges.air_humidity.ideal.max}%
                    </Text>
                  </Box>
                  
                  <Box 
                    p={6} 
                    borderRadius="lg" 
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex align="center">
                        <Box 
                          as="span" 
                          mr={2} 
                          fontSize="xl"
                          bg="green.100" 
                          color="green.500" 
                          p={1} 
                          borderRadius="md"
                        >
                          🌱
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">Soil Humidity</Text>
                      </Flex>
                      
                      <Box 
                        py={1} 
                        px={3} 
                        borderRadius="full"
                        bg={getReadingColor('soil_humidity', currentReading.predicted_soil_humidity) + '20'}
                        color={getReadingColor('soil_humidity', currentReading.predicted_soil_humidity)}
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {currentReading.predicted_soil_humidity < ranges.soil_humidity.ideal.min ? 'Too Dry' : 
                         currentReading.predicted_soil_humidity > ranges.soil_humidity.ideal.max ? 'Too Wet' : 'Optimal'}
                      </Box>
                    </Flex>
                    
                    <Flex align="baseline">
                      <Text 
                        fontSize="4xl" 
                        fontWeight="bold"
                        color={getReadingColor('soil_humidity', currentReading.predicted_soil_humidity)}
                        lineHeight="1"
                      >
                        {currentReading.predicted_soil_humidity}
                      </Text>
                      <Text 
                        fontSize="xl" 
                        color={getReadingColor('soil_humidity', currentReading.predicted_soil_humidity)}
                        ml={1}
                      >
                        %
                      </Text>
                    </Flex>
                    
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Ideal range: {ranges.soil_humidity.ideal.min}-{ranges.soil_humidity.ideal.max}%
                    </Text>
                  </Box>
                </SimpleGrid>
                
                {/* Second row - 2 items (centered) */}
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} bg="white" maxW={{ md: "66.67%" }} mx="auto" p={4} pb={6}>
                  <Box 
                    p={6} 
                    borderRadius="lg" 
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex align="center">
                        <Box 
                          as="span" 
                          mr={2} 
                          fontSize="xl"
                          bg="purple.100" 
                          color="purple.500" 
                          p={1} 
                          borderRadius="md"
                        >
                          ☁️
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">CO2 Level</Text>
                      </Flex>
                      
                      <Box 
                        py={1} 
                        px={3} 
                        borderRadius="full"
                        bg={getReadingColor('co2_level', currentReading.predicted_co2_level) + '20'}
                        color={getReadingColor('co2_level', currentReading.predicted_co2_level)}
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {currentReading.predicted_co2_level < ranges.co2_level.ideal.min ? 'Too Low' : 
                         currentReading.predicted_co2_level > ranges.co2_level.ideal.max ? 'Too High' : 'Optimal'}
                      </Box>
                    </Flex>
                    
                    <Flex align="baseline">
                      <Text 
                        fontSize="4xl" 
                        fontWeight="bold"
                        color={getReadingColor('co2_level', currentReading.predicted_co2_level)}
                        lineHeight="1"
                      >
                        {currentReading.predicted_co2_level}
                      </Text>
                      <Text 
                        fontSize="xl" 
                        color={getReadingColor('co2_level', currentReading.predicted_co2_level)}
                        ml={1}
                      >
                        ppm
                      </Text>
                    </Flex>
                    
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Ideal range: {ranges.co2_level.ideal.min}-{ranges.co2_level.ideal.max} ppm
                    </Text>
                  </Box>
                  
                  <Box 
                    p={6} 
                    borderRadius="lg" 
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex align="center">
                        <Box 
                          as="span" 
                          mr={2} 
                          fontSize="xl"
                          bg="yellow.100" 
                          color="yellow.500" 
                          p={1} 
                          borderRadius="md"
                        >
                          ☀️
                        </Box>
                        <Text fontWeight="bold" fontSize="lg">Light</Text>
                      </Flex>
                      
                      <Box 
                        py={1} 
                        px={3} 
                        borderRadius="full"
                        bg={getReadingColor('light_lux', currentReading.predicted_light_lux) + '20'}
                        color={getReadingColor('light_lux', currentReading.predicted_light_lux)}
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {currentReading.predicted_light_lux < ranges.light_lux.ideal.min ? 'Too Dim' : 
                         currentReading.predicted_light_lux > ranges.light_lux.ideal.max ? 'Too Bright' : 'Optimal'}
                      </Box>
                    </Flex>
                    
                    <Flex align="baseline">
                      <Text 
                        fontSize="4xl" 
                        fontWeight="bold"
                        color={getReadingColor('light_lux', currentReading.predicted_light_lux)}
                        lineHeight="1"
                      >
                        {currentReading.predicted_light_lux}
                      </Text>
                      <Text 
                        fontSize="xl" 
                        color={getReadingColor('light_lux', currentReading.predicted_light_lux)}
                        ml={1}
                      >
                        lux
                      </Text>
                    </Flex>
                    
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Ideal range: {ranges.light_lux.ideal.min}-{ranges.light_lux.ideal.max} lux
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
            
            {/* Insights and recommendations box */}
            {currentReading && generatedInsights.length > 0 && (
              <Box 
                mb={8} 
                bg="white" 
                p={5} 
                borderRadius="lg" 
                boxShadow="md"
                borderTop="4px solid"
                borderTopColor="green.400"
              >
                <Heading as="h2" size="md" mb={4} display="flex" alignItems="center">
                  <Box as="span" mr={2} fontSize="xl">💡</Box>
                  Recommended Actions
                </Heading>
                
                {generatedInsights.length <= 3 ? (
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
                    {generatedInsights.map((insight, index) => (
                      <Box 
                        key={index}
                        p={4}
                        borderRadius="md"
                        bg={insight.type === 'warning' ? 'yellow.50' : 'green.50'}
                        border="1px solid"
                        borderColor={insight.type === 'warning' ? 'yellow.200' : 'green.200'}
                      >
                        <Flex mb={2} align="center">
                          <Box fontSize="2xl" mr={2}>{insight.icon}</Box>
                          <Text fontWeight="bold" color={insight.type === 'warning' ? 'yellow.700' : 'green.700'}>
                            {insight.sensor === 'temperature' ? 'Temperature' : 
                              insight.sensor === 'air_humidity' ? 'Air Humidity' : 
                              insight.sensor === 'soil_humidity' ? 'Soil Humidity' :
                              insight.sensor === 'co2_level' ? 'CO2 Level' : 'Light'}
                          </Text>
                        </Flex>
                        <Text color={insight.type === 'warning' ? 'yellow.800' : 'green.800'}>
                          {insight.message}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box>
                    {/* First row - 3 items */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={5} mb={5}>
                      {generatedInsights.slice(0, 3).map((insight, index) => (
                        <Box 
                          key={index}
                          p={4}
                          borderRadius="md"
                          bg={insight.type === 'warning' ? 'yellow.50' : 'green.50'}
                          border="1px solid"
                          borderColor={insight.type === 'warning' ? 'yellow.200' : 'green.200'}
                        >
                          <Flex mb={2} align="center">
                            <Box fontSize="2xl" mr={2}>{insight.icon}</Box>
                            <Text fontWeight="bold" color={insight.type === 'warning' ? 'yellow.700' : 'green.700'}>
                              {insight.sensor === 'temperature' ? 'Temperature' : 
                                insight.sensor === 'air_humidity' ? 'Air Humidity' : 
                                insight.sensor === 'soil_humidity' ? 'Soil Humidity' :
                                insight.sensor === 'co2_level' ? 'CO2 Level' : 'Light'}
                            </Text>
                          </Flex>
                          <Text color={insight.type === 'warning' ? 'yellow.800' : 'green.800'}>
                            {insight.message}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>

                    {/* Second row - remaining items (centered) */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={5} maxW={{ md: "66%" }} mx="auto">
                      {generatedInsights.slice(3).map((insight, index) => (
                        <Box 
                          key={index + 3}
                          p={4}
                          borderRadius="md"
                          bg={insight.type === 'warning' ? 'yellow.50' : 'green.50'}
                          border="1px solid"
                          borderColor={insight.type === 'warning' ? 'yellow.200' : 'green.200'}
                        >
                          <Flex mb={2} align="center">
                            <Box fontSize="2xl" mr={2}>{insight.icon}</Box>
                            <Text fontWeight="bold" color={insight.type === 'warning' ? 'yellow.700' : 'green.700'}>
                              {insight.sensor === 'temperature' ? 'Temperature' : 
                                insight.sensor === 'air_humidity' ? 'Air Humidity' : 
                                insight.sensor === 'soil_humidity' ? 'Soil Humidity' :
                                insight.sensor === 'co2_level' ? 'CO2 Level' : 'Light'}
                            </Text>
                          </Flex>
                          <Text color={insight.type === 'warning' ? 'yellow.800' : 'green.800'}>
                            {insight.message}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Prediction charts with tabs for different sensor types */}
            <Box bg="white" p={5} borderRadius="lg" boxShadow="md" mb={8}>
              {/* Title and range selector aligned in the same row */}
              <Flex justify="space-between" align="center" mb={5}>
                <Box width="250px" visibility="hidden">
                  {/* Invisible spacer to balance layout */}
                </Box>
                
                <Heading 
                  as="h2" 
                  size="3xl" 
                  color="green.600"
                  fontWeight="extrabold"
                  letterSpacing="wide"
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
                <Flex borderBottom="1px solid" borderColor="gray.200" mb={4}>
                  {sensorTypes.map((type, index) => (
                    <Box 
                      key={type.id} 
                      px={4}
                      py={2}
                      cursor="pointer"
                      borderBottom={selectedSensorType === type.id ? "2px solid #38a169" : "none"}
                      color={selectedSensorType === type.id ? "green.500" : "gray.600"}
                      fontWeight={selectedSensorType === type.id ? "bold" : "normal"}
                      onClick={() => setSelectedSensorType(type.id)}
                    >
                      {type.label}
                    </Box>
                  ))}
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
            
            <Box 
              bg="white" 
              p={0} 
              borderRadius="xl" 
              boxShadow="lg"
              overflow="hidden"
            >
              <Box 
                bg="blue.600" 
                py={4}
                px={6}
                color="white"
              >
                <Flex align="center" gap={3}>
                  <Box
                    bg="white"
                    color="blue.600"
                    p={2}
                    borderRadius="md"
                    fontSize="xl"
                  >
                    <span role="img" aria-label="info">💡</span>
                  </Box>
                  <Heading as="h3" size="md" fontWeight="bold">
                    Understanding Your Predictions
                  </Heading>
                </Flex>
              </Box>
              
              <Box p={6}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Box 
                    p={5} 
                    bg="blue.50" 
                    borderRadius="lg" 
                    boxShadow="sm"
                    border="1px solid"
                    borderColor="blue.100"
                    transition="transform 0.2s"
                    _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
                  >
                    <Flex 
                      align="center" 
                      mb={4}
                      justify="center"
                      flexDir="column"
                      textAlign="center"
                    >
                      <Box 
                        bg="blue.100" 
                        color="blue.600"
                        p={2.5}
                        borderRadius="lg" 
                        mb={3}
                      >
                        <Box as="span" fontSize="xl">🔄</Box>
                      </Box>
                      <Heading as="h4" size="sm" color="blue.700">
                        Data Refresh System
                      </Heading>
                    </Flex>
                    <Text color="gray.700" fontSize="sm" lineHeight="tall">
                      Predictions refresh automatically every 30 seconds. For immediate updates, 
                      use the "Generate New Predictions" button to create fresh predictions from the current time.
                    </Text>
                  </Box>
                  
                  <Box 
                    p={5} 
                    bg="green.50" 
                    borderRadius="lg" 
                    boxShadow="sm"
                    border="1px solid"
                    borderColor="green.100"
                    transition="transform 0.2s"
                    _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
                  >
                    <Flex 
                      align="center" 
                      mb={4}
                      justify="center"
                      flexDir="column"
                      textAlign="center"
                    >
                      <Box 
                        bg="green.100" 
                        color="green.600"
                        p={2.5}
                        borderRadius="lg" 
                        mb={3}
                      >
                        <Box as="span" fontSize="xl">🌱</Box>
                      </Box>
                      <Heading as="h4" size="sm" color="green.700">
                        Actionable Insights
                      </Heading>
                    </Flex>
                    <Text color="gray.700" fontSize="sm" lineHeight="tall">
                      Our prediction model helps you anticipate environmental changes so you can take proactive 
                      measures for optimal plant health and growth.
                    </Text>
                  </Box>
                </SimpleGrid>
                
                <Box 
                  mt={5} 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="lg"
                  border="1px dashed"
                  borderColor="gray.200"
                >
                  <Flex 
                    align="center" 
                    mb={3}
                    justify="center"
                    flexDir="column"
                    textAlign="center"
                  >
                    <Box 
                      bg="purple.50" 
                      color="purple.500"
                      p={2}
                      borderRadius="md"
                      mb={2}
                    >
                      <Box as="span" fontSize="md">📈</Box>
                    </Box>
                    <Text fontWeight="medium" color="gray.700">
                      How to use these predictions
                    </Text>
                  </Flex>
                  <Text color="gray.600" fontSize="sm" lineHeight="tall" textAlign="center">
                    These predictions show expected sensor values based on historical patterns and environmental factors.
                    Use the prediction range selector to view short or long-term forecasts and plan your greenhouse management accordingly.
                  </Text>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default Predictions;
