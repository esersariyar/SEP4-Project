import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
  Spinner,
  Badge,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { LineChart } from './ui/chart';
import Header from './Header';

// Custom icons implemented using SVG instead of relying on external packages
const CustomIcon = (props: any) => {
  const { children, ...rest } = props;
  return (
    <Box
      as="span"
      display="flex"
      alignItems="center"
      justifyContent="center"
      lineHeight="1em"
      flexShrink={0}
      height="100%"
      width="100%"
      color="currentColor"
      {...rest}
    >
      {children}
    </Box>
  );
};

// SVG icons defined inline to avoid package dependency issues
const icons = {
  thermometer: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M14,14.76V3.5a3,3,0,0,0-3-3H11a3,3,0,0,0-3,3V14.76a5,5,0,1,0,6,0ZM11,5A1,1,0,0,1,12,4a1,1,0,0,1,0,2A1,1,0,0,1,11,5Z" />
      </svg>
    </CustomIcon>
  ),
  droplet: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,1.85a11.25,11.25,0,0,1,2.53,2.58C16.8,7.44,18,10.82,18,14a6,6,0,0,1-12,0c0-3.18,1.2-6.56,3.47-9.57A11.25,11.25,0,0,1,12,1.85Z" />
      </svg>
    </CustomIcon>
  ),
  alertCircle: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z" />
        <path d="M12,7a1,1,0,0,0-1,1v4a1,1,0,0,0,2,0V8A1,1,0,0,0,12,7Z" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    </CustomIcon>
  ),
  clock: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z" />
        <path d="M12,6a1,1,0,0,0-1,1v5a1,1,0,0,0,.293.707l3,3a1,1,0,0,0,1.414-1.414L13,11.586V7A1,1,0,0,0,12,6Z" />
      </svg>
    </CustomIcon>
  ),
  refresh: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,5V2L8,6l4,4V7a5,5,0,0,1,5,5,5,5,0,0,1-5,5,5,5,0,0,1-5-5H5a7,7,0,0,0,7,7,7,7,0,0,0,7-7A7,7,0,0,0,12,5Z" />
      </svg>
    </CustomIcon>
  ),
  checkCircle: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z" />
        <path d="M16.58,7.58L10,14.17l-2.59-2.58L6,13l4,4,8-8Z" />
      </svg>
    </CustomIcon>
  ),
  alertTriangle: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M22.56,16.3,14.89,3.58a3.43,3.43,0,0,0-5.78,0L1.44,16.3a3,3,0,0,0-.05,3A3.37,3.37,0,0,0,4.33,21H19.67a3.37,3.37,0,0,0,2.94-1.66A3,3,0,0,0,22.56,16.3ZM12,17a1,1,0,1,1,1-1A1,1,0,0,1,12,17Zm1-5a1,1,0,0,1-2,0V8a1,1,0,0,1,2,0Z" />
      </svg>
    </CustomIcon>
  ),
  barChart: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M21,20H4V18H21ZM8,17H4V10H8ZM14,17H10V3H14ZM20,17H16V7H20Z" />
      </svg>
    </CustomIcon>
  ),
  database: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,1C6.5,1,2,2.79,2,5S6.5,9,12,9s10-1.79,10-4S17.5,1,12,1ZM2,11V7.5c0,2.21,4.5,4,10,4s10-1.79,10-4V11c0,2.21-4.5,4-10,4S2,13.21,2,11Zm20,5.5V20c0,2.21-4.5,4-10,4S2,22.21,2,20V16.5c0,2.21,4.5,4,10,4S22,18.71,22,16.5Z" />
      </svg>
    </CustomIcon>
  )
};

interface SensorData {
  id?: number;
  temperature: number | string;
  humidity: number | string;
  prediction: 'Normal' | 'Alert' | 'Warning';
  timestamp: string;
  _source?: string;
  _highlight?: 'temperature' | 'humidity' | 'both';
}

interface HistoricalSensorData {
  data: SensorData[];
  _source?: string;
  range?: string;
  hours?: number;
}

type TimeRange = '1h' | '6h' | '12h' | '24h' | '7d' | '30d';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '12h', label: 'Last 12 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('24h');
  const [isGenerating, setIsGenerating] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [dataSource, setDataSource] = useState('demo');
  
  const lastUpdated = useRef(new Date());
  const previousData = useRef<SensorData | null>(null);
  
  const refreshInterval = 10000; 
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdated.current.getTime()) / 1000);
      setSecondsAgo(diff);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value as TimeRange;
    setSelectedRange(newRange);
    // Historical data will automatically update through the useEffect
  };

  const formatTimeAgo = (seconds: number): string => {
    if (seconds >= 60) {
      return "< 1 minute ago";
    } else {
      return `${seconds} seconds ago`;
    }
  };

  const generateDemoData = () => {
    const now = new Date();
    const id = Math.floor(Math.random() * 1000);
    
    const temperature = (20 + Math.random() * 10).toFixed(1);
    const humidity = (50 + Math.random() * 30).toFixed(1);
    
    let prediction: 'Normal' | 'Alert' | 'Warning' = 'Normal';
    if (parseFloat(temperature) > 28) prediction = 'Alert';
    else if (parseFloat(temperature) > 25) prediction = 'Warning';
    
    return {
      id,
      temperature,
      humidity,
      prediction,
      timestamp: now.toISOString(),
      _source: 'demo'
    };
  };

  const generateDemoHistoricalData = (range: TimeRange = '24h'): SensorData[] => {
    const now = new Date();
    const data: SensorData[] = [];
    
    let hours = 24;
    if (range === '1h') hours = 1;
    else if (range === '6h') hours = 6;
    else if (range === '12h') hours = 12;
    else if (range === '7d') hours = 168;  
    else if (range === '30d') hours = 720; 
    
    const interval = (hours * 60 * 60) / 100;  
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now.getTime() - ((99 - i) * interval * 1000));
      
      const hourOfDay = timestamp.getHours();
      const baseTemperature = 18 + (hourOfDay > 6 && hourOfDay < 18 ? 7 : 2); 
      const temperature = (baseTemperature + Math.random() * 5).toFixed(1);
      
      const baseHumidity = 55 + (hourOfDay > 6 && hourOfDay < 18 ? -5 : 10); 
      const humidity = (baseHumidity + Math.random() * 10).toFixed(1);
      
      let prediction: 'Normal' | 'Alert' | 'Warning' = 'Normal';
      if (parseFloat(temperature) > 28) prediction = 'Alert';
      else if (parseFloat(temperature) > 25) prediction = 'Warning';
      
      data.push({
        id: i,
        temperature,
        humidity,
        prediction,
        timestamp: timestamp.toISOString(),
        _source: 'demo'
      });
    }
    
    return data;
  };

  const handleGenerateDemoData = () => {
    setIsGenerating(true);
    
    const newData = generateDemoData();
    setData(newData);
    lastUpdated.current = new Date();
    setDataSource('demo');
    
    const newHistoricalData = generateDemoHistoricalData(selectedRange);
    setHistoricalData(newHistoricalData);
    
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  };

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const currentResponse = await fetch(`${API_URL}/api/sensors`);
      
      if (!currentResponse.ok) {
        throw new Error(`HTTP ${currentResponse.status}`);
      }
      
      const sensorData: SensorData = await currentResponse.json();
      console.log(' Current sensor data:', sensorData);
      
      if (previousData.current) {
        const prevTemp = previousData.current.temperature;
        const prevHumidity = previousData.current.humidity;
        
        if (prevTemp !== sensorData.temperature) {
          sensorData._highlight = 'temperature';
        }
        
        if (prevHumidity !== sensorData.humidity) {
          sensorData._highlight = sensorData._highlight === 'temperature' ? 'both' : 'humidity';
        }
      }
      
      previousData.current = sensorData;
      setData(sensorData);
      setDataSource('live');
      lastUpdated.current = new Date();
      setError(null);
    } catch (err: any) {
      setError('Error fetching sensor data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetches historical data based on the selected time range
  const fetchHistoricalData = useCallback(async () => {
    setError(null);
    try {
      if (dataSource === 'demo') {
        // For demo mode, use generated data
        const newHistoricalData = generateDemoHistoricalData(selectedRange);
        setHistoricalData(newHistoricalData);
      } else {
        // For live mode, fetch from API with the selected range parameter
        const historicalResponse = await fetch(`${API_URL}/api/sensors/history?range=${selectedRange}`);
        
        if (!historicalResponse.ok) {
          // If API fails, fallback to demo data
          console.warn('Failed to fetch historical data, falling back to demo data');
          const newHistoricalData = generateDemoHistoricalData(selectedRange);
          setHistoricalData(newHistoricalData);
        } else {
          const historyData = await historicalResponse.json();
          setHistoricalData(Array.isArray(historyData) ? historyData : historyData.data || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching historical data:', err);
      // Fallback to demo data in case of error
      const newHistoricalData = generateDemoHistoricalData(selectedRange);
      setHistoricalData(newHistoricalData);
    }
  }, [API_URL, selectedRange, dataSource]);

  useEffect(() => {
    // Generate some initial demo data if there's nothing to show
    if (!data && !historicalData.length) {
      handleGenerateDemoData();
    } else {
      fetchData();
      fetchHistoricalData();
    }
    
    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchData, fetchHistoricalData, refreshInterval]);

  // Update historical data when time range changes
  useEffect(() => {
    fetchHistoricalData();
  }, [selectedRange, fetchHistoricalData]);

  const ensureNumber = (value: string | number): number => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  };

  const getDateRangeText = () => {
    if (!historicalData || historicalData.length === 0) return '';
    
    const oldestData = new Date(historicalData[0].timestamp);
    const newestData = new Date(historicalData[historicalData.length - 1].timestamp);
    
    return `${oldestData.toLocaleDateString()} ${oldestData.toLocaleTimeString()} to ${newestData.toLocaleDateString()} ${newestData.toLocaleTimeString()}`;
  };

  return (
    <Box bg="#f8f9ff" minH="100vh">
      <Container maxW="container.xl" py={6}>
        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes highlight {
            0% { background-color: rgba(46, 204, 113, 0.3); }
            100% { background-color: transparent; }
          }
          
          .highlight-animation {
            animation: highlight 2s ease-out;
          }

          @keyframes chartAnimation {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          
          .chart-animation {
            animation: chartAnimation 0.8s ease-out forwards;
          }
        ` }} />

        {/* Error State */}
        {error && (
          <Box
            p={6}
            bg="red.50"
            borderRadius="xl"
            boxShadow="md"
            borderWidth="1px"
            borderColor="red.200"
            mb={6}
          >
            <Flex align="center" mb={4}>
              {icons.alertCircle({ boxSize: 6, color: "red.500", mr: 3 })}
              <Heading as="h2" size="md" color="red.500">Connection Error</Heading>
            </Flex>
            
            <Text mb={4}>{error}</Text>
            <Text fontWeight="medium">
              Please make sure the backend server is running at <Badge colorScheme="red">{API_URL}</Badge>
            </Text>
            
            <Button
              colorScheme="red"
              variant="outline"
              mt={4}
              onClick={() => window.location.reload()}
            >
              <Box as="span" display="flex" alignItems="center">
                {icons.refresh({ boxSize: 4, mr: 2 })}
                Retry Connection
              </Box>
            </Button>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            h="50vh" 
            borderRadius="xl"
            bg="white"
            boxShadow="sm"
            p={10}
            mb={6}
          >
            <Spinner 
              size="xl" 
              color="green.500"
              mb={6}
            />
            <Text fontSize="lg" color="gray.600">Loading greenhouse sensor data...</Text>
            <Text fontSize="sm" color="gray.400" mt={2}>This may take a few seconds</Text>
          </Flex>
        )}
        
        {/* Dashboard Content */}
        {!loading && !error && (
          <>
            {/* Dashboard Header */}
            <Flex 
              justify="space-between" 
              align="center" 
              mb={8}
              pb={3}
              borderBottomWidth="2px"
              borderBottomColor="gray.200"
            >
              <Heading 
                as="h1" 
                size="xl"
                color="green.600"
                display="flex"
                alignItems="center"
              >
                <Box mr={3}>{icons.barChart({ boxSize: 6 })}</Box> Via GreenHouse Dashboard
              </Heading>
              
              <Button
                colorScheme="green"
                size="md"
                disabled={isGenerating}
                onClick={handleGenerateDemoData}
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
              >
                <Box as="span" display="flex" alignItems="center">
                  {icons.database({ boxSize: 4, mr: 2 })}
                  Generate Demo Data
                </Box>
              </Button>
            </Flex>
            
            {/* Current Sensor Data Section */}
            <Box mb={8}>
              <Flex align="center" mb={4}>
                <Heading as="h2" size="lg" color="blue.500">
                  Current Sensor Data
                </Heading>
                <Badge 
                  ml={3} 
                  colorScheme="blue" 
                  fontSize="0.8em"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {dataSource}
                </Badge>
          </Flex>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={6}>
            {/* Temperature Card */}
            <Box
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
              _active={{ transform: 'scale(0.98)' }}
            >
              <Box
                bg="white"
                p={6}
                borderRadius="xl"
                boxShadow="md"
                borderLeftWidth="4px"
                borderLeftColor={ensureNumber(data?.temperature || 0) > 27 ? 'red.400' : 
                  ensureNumber(data?.temperature || 0) < 20 ? 'blue.400' : 'green.400'}
                height="100%"
              >
                <Flex align="center" mb={4}>
                  <Box
                    bg={ensureNumber(data?.temperature || 0) > 27 ? 'red.100' : 
                      ensureNumber(data?.temperature || 0) < 20 ? 'blue.100' : 'green.100'}
                    p={4}
                    borderRadius="lg"
                    mr={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {icons.thermometer({ 
                      boxSize: 10,
                      color: ensureNumber(data?.temperature || 0) > 27 ? 'red.500' : 
                        ensureNumber(data?.temperature || 0) < 20 ? 'blue.500' : 'green.500'
                    })}
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" color="gray.600">Temperature</Text>
                    <Text 
                      fontSize="3xl" 
                      fontWeight="bold"
                      color={ensureNumber(data?.temperature || 0) > 27 ? 'red.500' : 
                        ensureNumber(data?.temperature || 0) < 20 ? 'blue.500' : 'green.500'}
                    >
                      {ensureNumber(data?.temperature || 0).toFixed(1)}°C
                    </Text>
                  </Box>
                </Flex>
                
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Ideal range: <Badge colorScheme="green">18-30°C</Badge>
                </Text>
              </Box>
            </Box>
            
            {/* Humidity Card */}
            <Box
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
              _active={{ transform: 'scale(0.98)' }}
            >
              <Box
                bg="white"
                p={6}
                borderRadius="xl"
                boxShadow="md"
                borderLeftWidth="4px"
                borderLeftColor={ensureNumber(data?.humidity || 0) > 65 ? 'red.400' : 
                  ensureNumber(data?.humidity || 0) < 50 ? 'blue.400' : 'green.400'}
                height="100%"
              >
                <Flex align="center" mb={4}>
                  <Box
                    bg={ensureNumber(data?.humidity || 0) > 65 ? 'red.100' : 
                      ensureNumber(data?.humidity || 0) < 50 ? 'blue.100' : 'green.100'}
                    p={4}
                    borderRadius="lg"
                    mr={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {icons.droplet({ 
                      boxSize: 10,
                      color: ensureNumber(data?.humidity || 0) > 65 ? 'red.500' : 
                        ensureNumber(data?.humidity || 0) < 50 ? 'blue.500' : 'green.500'
                    })}
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" color="gray.600">Humidity</Text>
                    <Text 
                      fontSize="3xl" 
                      fontWeight="bold"
                      color={ensureNumber(data?.humidity || 0) > 65 ? 'red.500' : 
                        ensureNumber(data?.humidity || 0) < 50 ? 'blue.500' : 'green.500'}
                    >
                      {ensureNumber(data?.humidity || 0).toFixed(1)}%
                    </Text>
                  </Box>
                </Flex>
                
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Ideal range: <Badge colorScheme="green">45-70%</Badge>
                </Text>
              </Box>
            </Box>
            
            {/* Status Card */}
            <Box
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
              _active={{ transform: 'scale(0.98)' }}
            >
              <Box
                bg="white"
                p={6}
                borderRadius="xl"
                boxShadow="md"
                borderLeftWidth="4px"
                borderLeftColor={data?.prediction === 'Normal' ? 'green.400' : 
                  data?.prediction === 'Warning' ? 'orange.400' : 'red.400'}
                height="100%"
              >
                <Flex align="center" mb={4}>
                  <Box
                    bg={data?.prediction === 'Normal' ? 'green.100' : 
                      data?.prediction === 'Warning' ? 'orange.100' : 'red.100'}
                    p={4}
                    borderRadius="lg"
                    mr={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {data?.prediction === 'Normal' ? icons.checkCircle({ 
                      boxSize: 10,
                      color: 'green.500'
                    }) : data?.prediction === 'Warning' ? icons.alertTriangle({
                      boxSize: 10,
                      color: 'orange.500'
                    }) : icons.alertCircle({
                      boxSize: 10,
                      color: 'red.500'
                    })}
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" color="gray.600">Status</Text>
                    <Text 
                      fontSize="3xl" 
                      fontWeight="bold"
                      color={data?.prediction === 'Normal' ? 'green.500' : 
                        data?.prediction === 'Warning' ? 'orange.500' : 'red.500'}
                    >
                      {data?.prediction || 'Normal'}
                    </Text>
                  </Box>
                </Flex>
                
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {data?.prediction === 'Normal' ? 'All parameters in safe range' : 
                   data?.prediction === 'Warning' ? 'Some parameters near thresholds' : 
                   data?.prediction === 'Alert' ? 'Immediate action required!' : 'Loading...'}
                </Text>
              </Box>
            </Box>
          </SimpleGrid>
          
          <Flex justifyContent="flex-end" align="center" mt={2}>
            <Box mr={2}>{icons.clock({ boxSize: 4, color: "gray.500" })}</Box>
            <Text fontSize="sm" color="gray.500" mr={3}>
              Last updated: {data ? new Date(data.timestamp).toLocaleString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) : 'Loading...'}
            </Text>
            
            <Badge colorScheme="blue" borderRadius="full" px={3}>
              {formatTimeAgo(secondsAgo)}
            </Badge>
          </Flex>
        </Box>
        
        {/* Historical Data Section */}
        <Box
          bg="white"
          borderRadius="xl"
          p={6}
          boxShadow="md"
          mb={8}
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb={5}>
            <Heading as="h2" size="md" color="blue.500" display="flex" alignItems="center">
              <Box mr={2}>{icons.barChart({ boxSize: 5 })}</Box> Historical Data
            </Heading>
            
            <HStack gap={3}>
              <Text color="gray.600" fontWeight="medium">Time Range:</Text>
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
                  width: "auto"
                }}
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <Button 
                onClick={() => {
                  fetchData();
                  fetchHistoricalData();
                }} 
                size="sm" 
                colorScheme="blue" 
              >
                <Box as="span" display="flex" alignItems="center">
                  {icons.refresh({ boxSize: 4, mr: 2 })}
                  Refresh
                </Box>
              </Button>
            </HStack>
          </Flex>
          
          {historicalData.length > 0 && (
            <Badge 
              mb={4} 
              p={2} 
              borderRadius="md"
              colorScheme="blue"
              variant="subtle"
              fontSize="sm"
            >
              Showing data from {getDateRangeText()} ({historicalData.length} data points)
            </Badge>
          )}
          
          <Box mb={8} borderWidth="1px" borderRadius="lg" p={4} bg="white" boxShadow="sm">
            <Flex align="center" mb={2}>
              <Box p={1} borderRadius="md" bg="red.50" color="red.500" mr={2}>
                {icons.barChart({ boxSize: 4 })}
              </Box>
              <Heading as="h3" size="sm" color="gray.700">Temperature Trend</Heading>
            </Flex>
            
            <Box className="chart-animation">
              <LineChart 
                key={`temp-chart-${selectedRange}-${historicalData.length}`}
                data={historicalData} 
                xAxisKey="timestamp" 
                yAxisKeys={[{ key: 'temperature', color: '#ff6b6b', name: 'Temperature (°C)' }]}
                height={300}
                formatXAxis={(value: string) => {
                  try {
                    // Use Intl.DateTimeFormat with explicit Copenhagen timezone (Europe/Copenhagen)
                    const date = new Date(value);
                    
                    if (selectedRange === '1h' || selectedRange === '6h' || selectedRange === '12h' || selectedRange === '24h') {
                      // For hour-based ranges, show time only
                      return new Intl.DateTimeFormat('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Copenhagen'
                      }).format(date);
                    } else {
                      // For day-based ranges, show date only
                      return new Intl.DateTimeFormat('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'Europe/Copenhagen'
                      }).format(date);
                    }
                  } catch (e) {
                    console.error('Error formatting date:', e);
                    return '';
                  }
                }}
              />
            </Box>
          </Box>
          
          <Box mb={4} borderWidth="1px" borderRadius="lg" p={4} bg="white" boxShadow="sm">
            <Flex align="center" mb={2}>
              <Box p={1} borderRadius="md" bg="blue.50" color="blue.500" mr={2}>
                {icons.barChart({ boxSize: 4 })}
              </Box>
              <Heading as="h3" size="sm" color="gray.700">Humidity Trend</Heading>
            </Flex>
            
            <Box className="chart-animation" style={{ animationDelay: "0.2s" }}>
              <LineChart 
                key={`humidity-chart-${selectedRange}-${historicalData.length}`}
                data={historicalData} 
                xAxisKey="timestamp" 
                yAxisKeys={[{ key: 'humidity', color: '#4dabf7', name: 'Humidity (%)' }]}
                height={300}
                formatXAxis={(value: string) => {
                  try {
                    // Use Intl.DateTimeFormat with explicit Copenhagen timezone (Europe/Copenhagen)
                    const date = new Date(value);
                    
                    if (selectedRange === '1h' || selectedRange === '6h' || selectedRange === '12h' || selectedRange === '24h') {
                      // For hour-based ranges, show time only
                      return new Intl.DateTimeFormat('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Copenhagen'
                      }).format(date);
                    } else {
                      // For day-based ranges, show date only
                      return new Intl.DateTimeFormat('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'Europe/Copenhagen'
                      }).format(date);
                    }
                  } catch (e) {
                    console.error('Error formatting date:', e);
                    return '';
                  }
                }}
              />
            </Box>
          </Box>
          
          <Flex justify="flex-end" align="center">
            <HStack gap={2} align="center">
              <Text fontSize="sm" color="gray.600">Data source:</Text>
              {loading ? (
                <Badge colorScheme="yellow" variant="subtle" display="flex" alignItems="center">
                  <Box as="span" mr="4px">{icons.clock({ boxSize: 3 })}</Box> Updating...
                </Badge>
              ) : dataSource === 'live' ? (
                <Badge colorScheme="green" variant="subtle" display="flex" alignItems="center">
                  <Box as="span" mr="4px">{icons.database({ boxSize: 3 })}</Box> Live Data
                </Badge>
              ) : (
                <Badge colorScheme="purple" variant="subtle" display="flex" alignItems="center">
                  <Box as="span" mr="4px">{icons.alertTriangle({ boxSize: 3 })}</Box> Demo Data
                </Badge>
              )}
            </HStack>
              </Flex>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
