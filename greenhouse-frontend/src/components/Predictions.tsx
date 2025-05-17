import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PredictionChart } from './ui/PredictionChart';
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
  timestamp: string;
}

// Define ranges for each reading type for mocking purposes
const ranges = {
  temp: { min: 15, max: 35, ideal: { min: 22, max: 28 } },
  air_humidity: { min: 35, max: 75, ideal: { min: 50, max: 65 } },
  soil_humidity: { min: 30, max: 70, ideal: { min: 45, max: 60 } }
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
  { id: 'soil_humidity', label: 'Soil Humidity', unit: '%', color: '#20c997' }
];

// Helper function to format X-axis labels for the chart
const formatChartXAxis = (timeStr: string): string => {
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      return 'Invalid';
    }
    
    // Check if date is part of a multi-day range
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // For dates not on the current day, include the date
    if (!isToday) {
      const dateStr = date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
      return `${dateStr}, ${formattedTime}`;
    }
    
    return formattedTime;
  } catch (e) {
    console.error('Error formatting x-axis label:', e);
    return '';
  }
};

// Function to generate mock data in case the API fails completely
const generateLocalMockData = (hours = 24): PredictionData[] => {
  const data: PredictionData[] = [];
  const now = new Date();
  
  // Create realistic base values
  const baseTemp = 22.5 + (Math.random() * 1.5); // Range: 22.5-24°C
  const baseAirHumidity = 53.0 + (Math.random() * 3.0); // Range: 53-56%
  const baseSoilHumidity = 48.0 + (Math.random() * 2.0); // Range: 48-50%
  
  // Create realistic variations
  // Day-night cycle (approx 2°C difference)
  const dayTemp = baseTemp + 1.0;
  const nightTemp = baseTemp - 1.0;
  
  // Day-night humidity (inverse to temperature, 5-8% difference)
  const dayAirHumidity = baseAirHumidity - 3.0;
  const nightAirHumidity = baseAirHumidity + 5.0;
  
  // Generate data points at 30-minute intervals for more natural curves
  const interval = hours <= 6 ? 0.25 : hours <= 24 ? 0.5 : 1; // 15min, 30min or 1hr intervals
  const dataPoints = Math.ceil(hours / interval);
  
  // Get the current hour for day/night cycle alignment
  const currentHour = now.getHours();
  
  // Calculate precise data points
  for (let i = 0; i < dataPoints; i++) {
    // Calculate timestamp for this data point
    const timestamp = new Date(now);
    const hourOffset = i * interval;
    const wholeHours = Math.floor(hourOffset);
    const fractionalHour = hourOffset - wholeHours;
    const minutes = Math.round(fractionalHour * 60);
    
    timestamp.setHours(timestamp.getHours() + wholeHours);
    timestamp.setMinutes(timestamp.getMinutes() + minutes);
    timestamp.setSeconds(0);
    timestamp.setMilliseconds(0);
    
    // Determine where in day/night cycle we are (0-1 value, 0=midnight, 0.5=noon)
    const hourOfDay = (currentHour + hourOffset) % 24;
    const dayProgress = hourOfDay / 24;
    
    // Sinusoidal pattern for day-night cycle (peaks at noon, lowest at midnight)
    const dayFactor = Math.sin((dayProgress * 2 - 0.5) * Math.PI);
    
    // Calculate temperature with day-night cycle
    let temp = baseTemp + (dayFactor * 1.2);
    
    // Calculate humidity with inverse day-night cycle
    let airHumidity = baseAirHumidity - (dayFactor * 4.0);
    let soilHumidity = baseSoilHumidity - (dayFactor * 1.2);
    
    // Add small random variations (0.1-0.3°C/%)
    temp += (Math.random() * 0.2) - 0.1;
    airHumidity += (Math.random() * 0.6) - 0.3;
    soilHumidity += (Math.random() * 0.4) - 0.2;
    
    // Add subtle trends for longer predictions (gradual changes over days)
    if (hours > 24) {
      // Day factor (0-1 over the span of days)
      const dayNumber = hourOffset / 24;
      
      // Sinusoidal multi-day patterns (subtle weather changes)
      const multiDayFactor = Math.sin(dayNumber * Math.PI / 3) * 0.5; // 6-day cycle
      
      // Apply multi-day trends
      temp += multiDayFactor * 0.8;
      airHumidity += multiDayFactor * -2.0; // Inverse relationship
      soilHumidity += multiDayFactor * -1.0; // Soil responds more slowly
    }
    
    // Add data point with well-formatted values
    data.push({
      id: i + 1,
      predicted_temp: Number(temp.toFixed(1)),
      predicted_air_humidity: Number(airHumidity.toFixed(1)),
      predicted_soil_humidity: Number(soilHumidity.toFixed(1)),
      timestamp: timestamp.toISOString()
    });
  }
  
  return data;
};

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

  // Fetch prediction data from the API
  const fetchPredictions = useCallback(async (range = selectedRange) => {
    setError(null);
    try {
      // Set refreshing indicator
      setIsRefreshing(true);
      
      // Fetch prediction data
      console.log(`📊 Fetching prediction data for range: ${range}...`);
      const response = await fetch(`${API_URL}/api/predictions?range=${range}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Prediction data received:', data.data?.length || 0, 'records');
      
      // Update state
      if (data.data && data.data.length > 0) {
        setPredictionData(data.data);
        setLastUpdated(new Date());
        
        if (data._source) {
          setDataSource(data._source);
        }
      } else {
        // If no data returned, use local mock data
        console.log('No prediction data received, using local mock data');
        setPredictionData(generateLocalMockData(getHoursFromRange(range)));
        setDataSource('local mock');
      }
      
      setIsLoading(false);
      
      // Clear refreshing indicator after a short delay to make it visible
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching prediction data:', err);
      
      // Fall back to local mock data on error
      console.log('Using local mock data due to API error');
      setPredictionData(generateLocalMockData(getHoursFromRange(range)));
      setDataSource('local mock (API error)');
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [API_URL]);

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
      
      console.log("📊 Generating prediction data...");
      const response = await fetch(`${API_URL}/api/predictions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log("📊 Prediction data generation result:", result);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${result.message || 'Unknown error'}`);
      }
      
      // Show a success message
      showMessage(result.message || "New predictions were generated successfully!", 'success');
      
      // Refresh data after generation
      fetchPredictions(selectedRange);
    } catch (err) {
      console.error("Error generating prediction data:", err);
      setError(err instanceof Error ? err.message : "Failed to generate prediction data");
      
      // Show error message
      showMessage(err instanceof Error ? err.message : "Failed to generate prediction data", 'error');
      
      // Generate mock data locally as a fallback
      setPredictionData(generateLocalMockData(getHoursFromRange(selectedRange)));
      setDataSource('local mock (generation failed)');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle range selection
  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Range changed to:', e.target.value);
    setSelectedRange(e.target.value);
    // Our useMemo hook (processedChartData) will automatically refilter the data based on the new range
  };

  // Initialize with API data
  useEffect(() => {
    // Initial data fetch
    setIsLoading(true); 
    fetchPredictions(selectedRange);
    
    // Set up interval for refreshing data every 30 seconds
    const intervalId = setInterval(() => {
      console.log('📊 Refresh interval triggered (30s)');
      fetchPredictions(selectedRange);
    }, 30000);
    
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPredictions]); // Remove selectedRange from dependencies

  // Process data for the chart based on selected sensor type and time range
  const processedChartData = useMemo(() => {
    if (!predictionData.length) return [];
    
    // Parse dates consistently
    const parseDate = (dateStr: string): Date => {
      try {
        // Handle MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        if (dateStr.includes(' ') && dateStr.indexOf('-') === 4) {
          const [datePart, timePart] = dateStr.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hour, minute, second] = timePart.split(':').map(Number);
          return new Date(year, month - 1, day, hour, minute, second);
        }
        
        // Standard ISO string format
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
        
        return new Date(); // Fallback
      } catch (e) {
        console.error('Error parsing date:', dateStr, e);
        return new Date();
      }
    };
    
    // Process all data points
    const processedData = predictionData
      .map(item => {
        const parsedDate = parseDate(item.timestamp);
        return {
          ...item,
          parsedDate,
          timestamp: item.timestamp,
          ms: parsedDate.getTime()
        };
      })
      .sort((a, b) => a.ms - b.ms);
      
    // Get the hours for the selected range
    const hours = getHoursFromRange(selectedRange);
    
    // Use current time as the starting point, not the first data point
    const now = new Date();
    const endTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    console.log(`Time range: From ${now.toLocaleString()} to ${endTime.toLocaleString()}`);
    console.log(`Total data points: ${processedData.length}`);
    
    // Filter data to selected time range
    const nowMs = now.getTime();
    const endTimeMs = endTime.getTime();
    
    // Only include points within our time window (current time to end of selected range)
    const filteredData = processedData.filter(item => {
      return item.ms >= nowMs && item.ms <= endTimeMs;
    });
    
    console.log(`Filtered to ${filteredData.length} points within selected range`);
    
    // Map to chart format
    return filteredData.map(item => ({
      timestamp: item.timestamp,
      date: item.parsedDate, // Keep date object for easier debugging
      [selectedSensorType]: selectedSensorType === 'temp' 
        ? item.predicted_temp 
        : selectedSensorType === 'air_humidity' 
          ? item.predicted_air_humidity 
          : item.predicted_soil_humidity
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
              <Text>Error from API: {error}. Using fallback data.</Text>
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
          <Box p={6} bg="blue.50" color="blue.600" borderRadius="lg" textAlign="center" boxShadow="sm">
            <Box as="span" fontSize="3xl" mb={3} display="block">🌱</Box>
            <Text fontSize="lg" mb={2} fontWeight="medium">No predictions available yet</Text>
            <Text>Click "Generate New Predictions" to create prediction data for your greenhouse.</Text>
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
                
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={0} bg="white">
                  <Box 
                    p={5} 
                    borderRadius="lg" 
                    bg="white"
                    borderBottom={{ base: "1px solid", md: "none" }}
                    borderRight={{ md: "1px solid" }}
                    borderColor="gray.200"
                    position="relative"
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
                    p={5} 
                    borderRadius="lg" 
                    bg="white"
                    borderBottom={{ base: "1px solid", md: "none" }}
                    borderRight={{ md: "1px solid" }}
                    borderColor="gray.200"
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
                    p={5} 
                    borderRadius="lg" 
                    bg="white"
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
                            insight.sensor === 'air_humidity' ? 'Air Humidity' : 'Soil Humidity'}
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
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      color: '#2D3748',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginBottom: '8px'
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
                      <Box h="400px">
                        <PredictionChart
                          data={processedChartData}
                          xAxisKey="timestamp"
                          yAxisKeys={[{ 
                            key: type.id, 
                            color: type.color, 
                            name: `${type.label} (${type.unit})` 
                          }]}
                          height={380}
                          formatXAxis={formatChartXAxis}
                          timeRange={selectedRange}
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

