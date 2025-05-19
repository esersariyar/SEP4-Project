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
  Stack,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { LineChart } from './ui/chart';
import { ChakraLineChart } from './ui/chakra-chart';
// Import utility functions
import { 
  ensureNumber, 
  formatTimeAgo, 
  formatDateTime
} from '../utils';

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
  ),
  co2: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2ZM8,13.5A1.5,1.5,0,1,1,9.5,12,1.5,1.5,0,0,1,8,13.5ZM9,9H6V7h3Zm3,1.5A1.5,1.5,0,1,1,13.5,9,1.5,1.5,0,0,1,12,10.5Zm3,3A1.5,1.5,0,1,1,16.5,12,1.5,1.5,0,0,1,15,13.5Zm0-4.5H15V7h3v2H15Z" />
      </svg>
    </CustomIcon>
  ),
  light: (props: any) => (
    <CustomIcon {...props}>
      <svg viewBox="0 0 24 24" width="2.5em" height="2.5em" fill="currentColor" strokeWidth="0.4">
        <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
        <path d="M12,6a6,6,0,0,0-6,6,5.89,5.89,0,0,0,.5,2.5L12,12l5.5,2.5A5.89,5.89,0,0,0,18,12,6,6,0,0,0,12,6Z"/>
        <path d="M12,8a4,4,0,0,1,4,4,3.91,3.91,0,0,1-.33,1.5L12,13.5l-3.67-1A3.91,3.91,0,0,1,8,12,4,4,0,0,1,12,8Z"/>
      </svg>
    </CustomIcon>
  ),
};

interface SensorData {
  id?: number;
  temperature: number | string;
  humidity: number | string;
  air_humidity?: number | string;    
  soil_humidity?: number | string; 
  co2_level?: number | string; 
  light_lux?: number | string;
  prediction: 'Normal' | 'Alert' | 'Warning';
  timestamp: string;
  _source?: string;
  _highlight?: 'temperature' | 'humidity' | 'both';
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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('24h');
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [dataSource, setDataSource] = useState('live');
  const [activeTab, setActiveTab] = useState(0);
  const [noDataInRange, setNoDataInRange] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('autoRefresh');
    return saved ? JSON.parse(saved) : true; // varsayılan olarak açık
  });
  
  const lastUpdated = useRef<Date | null>(null);
  const previousData = useRef<SensorData | null>(null);
  const updateTimeRef = useRef<number>(Date.now());
  
  const refreshInterval = 10000; 
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Auto refresh için interval ref
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - updateTimeRef.current) / 1000);
      setSecondsAgo(diff);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRange(e.target.value as TimeRange);
    // Reset no data flag when range changes
    setNoDataInRange(false);
    fetchHistoricalData(e.target.value as TimeRange);
  };

  const fetchHistoricalData = useCallback(async (range: TimeRange = selectedRange) => {
    setHistoryLoading(true);
    try {
      console.log(`Fetching data for range: ${range}`);
      
      const response = await fetch(`${API_URL}/api/sensors/history?range=${range}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No data found for the selected time range (${range})`);
        } else {
          throw new Error(`HTTP error ${response.status}`);
        }
      }
      
      const responseJson = await response.json();
      console.log('Historical API response:', responseJson);
      
      let processedData = [];
      
      if (responseJson && responseJson.data && Array.isArray(responseJson.data)) {
        processedData = responseJson.data;
        console.log('Processed data length:', processedData.length);
        console.log('First record:', processedData[0]);
        console.log('Last record:', processedData[processedData.length - 1]);
      } else if (Array.isArray(responseJson)) {
        processedData = responseJson;
        console.log('Direct array response length:', processedData.length);
      } else {
        console.error('Unexpected API response format:', responseJson);
        throw new Error('API unexpected response format');
      }
      
      const formattedData = processedData.map((item: any) => {
        const timestamp = item.timestamp || new Date().toISOString();
        
        const processed: SensorData = {
          id: item.id || Math.random(),
          temperature: item.temperature || 0,
          humidity: item.air_humidity || item.humidity || 0, // Eski API uyumluluğu için
          soil_humidity: item.soil_humidity || 0,
          co2_level: item.co2_level || 0,
          light_lux: item.light_lux || 0,
          prediction: 'Normal',
          timestamp: timestamp
        };
        
        if (ensureNumber(processed.temperature) > 28 || 
            ensureNumber(processed.humidity) > 70 || 
            ensureNumber(processed.soil_humidity as number | string) > 70 ||
            ensureNumber(processed.co2_level as number | string) > 1000 ||
            ensureNumber(processed.light_lux as number | string) > 10000) {
          processed.prediction = 'Alert';
        } else if (ensureNumber(processed.temperature) > 25 || 
                  ensureNumber(processed.humidity) > 65 || 
                  ensureNumber(processed.soil_humidity as number | string) > 65 ||
                  ensureNumber(processed.co2_level as number | string) > 900 ||
                  ensureNumber(processed.light_lux as number | string) > 8000) {
          processed.prediction = 'Warning';
        }
        
        return processed;
      });
      
      console.log('Formatted data length:', formattedData.length);
      
      if (formattedData.length > 0) {
        // Verileri zaman damgasına göre sırala
        formattedData.sort((a: SensorData, b: SensorData) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        // En son verinin zamanını al
        const lastDataTime = new Date(formattedData[formattedData.length - 1].timestamp);
        console.log('Last data timestamp:', lastDataTime.toISOString());
        
        // Zaman aralığını hesapla
        const hoursToSubtract = range === '1h' ? 1 : 
                             range === '6h' ? 6 : 
                             range === '12h' ? 12 : 
                             range === '24h' ? 24 : 
                             range === '7d' ? 168 : 720;
                             
        const pastTime = new Date(lastDataTime.getTime() - (hoursToSubtract * 60 * 60 * 1000));
        
        console.log(`Filtering for range ${range} (${hoursToSubtract} hours)`);
        console.log('Past time:', pastTime.toISOString());
        console.log('Last data time:', lastDataTime.toISOString());
        
        // Verileri filtrele
        const filteredByTimeRange = formattedData.filter((item: SensorData) => {
          const itemDate = new Date(item.timestamp);
          const isInRange = itemDate >= pastTime && itemDate <= lastDataTime;
          if (!isInRange) {
            console.log('Filtered out record:', {
              timestamp: item.timestamp,
              itemDate: itemDate.toISOString(),
              isInRange
            });
          }
          return isInRange;
        });
        
        console.log(`Filtered ${formattedData.length} records to ${filteredByTimeRange.length} within time range`);
        
        if (filteredByTimeRange.length > 0) {
          setHistoricalData(filteredByTimeRange);
          setNoDataInRange(false);
        } else {
          setHistoricalData([]);
          setNoDataInRange(true);
        }
      } else {
        setHistoricalData([]);
        setNoDataInRange(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch historical data:', err);
      setError('Failed to fetch historical data: ' + (err.message || 'Unknown error'));
      setNoDataInRange(true);
      setHistoricalData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedRange, API_URL]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      console.log('Fetching current sensor data...');
      const currentResponse = await fetch(`${API_URL}/api/sensors`);
      
      if (!currentResponse.ok) {
        throw new Error(`HTTP error: ${currentResponse.status}`);
      }
      
      const sensorData = await currentResponse.json();
      console.log('API response data:', sensorData);
      
      const cleanedData: SensorData = {
        id: sensorData.id,
        temperature: sensorData.temperature,
        humidity: sensorData.air_humidity || sensorData.humidity, // Eski API uyumluluğu için
        soil_humidity: sensorData.soil_humidity || 0,
        co2_level: sensorData.co2_level || 0,
        light_lux: sensorData.light_lux || 0,
        prediction: 'Normal',
        timestamp: sensorData.timestamp
      };
      
      // Set prediction based on all values
      if (ensureNumber(cleanedData.temperature) > 28 || 
          ensureNumber(cleanedData.humidity) > 70 || 
          ensureNumber(cleanedData.soil_humidity as number | string) > 70 ||
          ensureNumber(cleanedData.co2_level as number | string) > 1000 ||
          ensureNumber(cleanedData.light_lux as number | string) > 10000) {
        cleanedData.prediction = 'Alert';
      } else if (ensureNumber(cleanedData.temperature) > 25 || 
                ensureNumber(cleanedData.humidity) > 65 || 
                ensureNumber(cleanedData.soil_humidity as number | string) > 65 ||
                ensureNumber(cleanedData.co2_level as number | string) > 900 ||
                ensureNumber(cleanedData.light_lux as number | string) > 8000) {
        cleanedData.prediction = 'Warning';
      }
      
      console.log('Processed data:', cleanedData);
      
      if (previousData.current) {
        const prevTemp = previousData.current.temperature;
        const prevHumidity = previousData.current.humidity;
        const prevSoilHumidity = previousData.current.soil_humidity;
        
        if (prevTemp !== cleanedData.temperature) {
          cleanedData._highlight = 'temperature';
        }
        
        if (prevHumidity !== cleanedData.humidity || prevSoilHumidity !== cleanedData.soil_humidity) {
          cleanedData._highlight = cleanedData._highlight === 'temperature' ? 'both' : 'humidity';
        }
      }
      
      previousData.current = cleanedData;
      setData(cleanedData);
      setDataSource('live');
      
      // Her veri güncellemesinde secondsAgo'yu sıfırla
      updateTimeRef.current = Date.now();
      setSecondsAgo(0);
      
      // Timestamp'i UTC olarak parse et ve lastUpdated'ı güncelle
      const [datePart, timePart] = cleanedData.timestamp.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');
      lastUpdated.current = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      ));
      
      setError(null);
      
      if (historicalData.length === 0) {
        fetchHistoricalData();
      }
    } catch (err: any) {
      console.error('Failed to fetch current sensor data:', err);
      setError('Failed to fetch sensor data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [API_URL, fetchHistoricalData, historicalData.length]);

  // Auto refresh ayarını değiştirme fonksiyonu
  const toggleAutoRefresh = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    localStorage.setItem('autoRefresh', JSON.stringify(newValue));
    
    if (newValue) {
      // Auto refresh'i başlat
      startAutoRefresh();
    } else {
      // Auto refresh'i durdur
      stopAutoRefresh();
    }
  };

  // Auto refresh'i başlat
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }
    
    autoRefreshIntervalRef.current = setInterval(() => {
      fetchHistoricalData();
    }, 10000); // 10 saniyede bir güncelle
  }, [fetchHistoricalData]);

  // Auto refresh'i durdur
  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, []);

  // Component mount olduğunda auto refresh'i başlat
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    }
    
    return () => {
      stopAutoRefresh();
    };
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

  useEffect(() => {
    // Initial data fetch
    fetchData();
    fetchHistoricalData();
    
    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchData, fetchHistoricalData, refreshInterval]);

  const getDateRangeText = () => {
    if (!historicalData || historicalData.length === 0) return '';
    
    try {
      // Get raw date strings
      const oldestTimestamp = historicalData[0].timestamp;
      const newestTimestamp = historicalData[historicalData.length - 1].timestamp;
      
      console.log('Date range timestamps:', oldestTimestamp, newestTimestamp);
      
      // Parse first date
      const oldestTimeMatch = oldestTimestamp.match(/T(\d{2}):(\d{2})/);
      const oldestDateMatch = oldestTimestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
      
      // Parse last date
      const newestTimeMatch = newestTimestamp.match(/T(\d{2}):(\d{2})/);
      const newestDateMatch = newestTimestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
      
      if (oldestTimeMatch && oldestDateMatch && newestTimeMatch && newestDateMatch) {
        // First date
        const oldestHour = oldestTimeMatch[1];
        const oldestMinute = oldestTimeMatch[2];
        const oldestYear = oldestDateMatch[1];
        const oldestMonth = parseInt(oldestDateMatch[2]);
        const oldestDay = oldestDateMatch[3];
        
        // Last date
        const newestHour = newestTimeMatch[1];
        const newestMinute = newestTimeMatch[2];
        const newestYear = newestDateMatch[1];
        const newestMonth = parseInt(newestDateMatch[2]);
        const newestDay = newestDateMatch[3];
        
        return `From ${oldestDay}/${oldestMonth}/${oldestYear} ${oldestHour}:${oldestMinute} to ${newestDay}/${newestMonth}/${newestYear} ${newestHour}:${newestMinute}`;
      }
      
      return '';
    } catch (err) {
      console.error('Error formatting date range:', err);
      return '';
    }
  };

  // Reusable Card Skeleton component
  const CardSkeleton = () => (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      boxShadow="md"
      borderLeftWidth="4px"
      borderLeftColor="gray.300"
      height="100%"
    >
      <Flex align="center" mb={4}>
        <Skeleton
          height="80px"
          width="80px"
          borderRadius="lg"
          mr={4}
        />
        <Box width="100%">
          <SkeletonText noOfLines={1} width="50%" mb={2} />
          <Skeleton height="36px" width="70%" />
        </Box>
      </Flex>
      <SkeletonText noOfLines={1} width="80%" mt={2} />
    </Box>
  );

  // Chart Skeleton component
  const ChartSkeleton = () => (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      p={4} 
      bg="white" 
      boxShadow="sm"
      height="450px"
    >
      <Flex align="center" mb={4}>
        <Skeleton height="24px" width="200px" />
      </Flex>
      <Skeleton height="400px" width="100%" borderRadius="md" />
    </Box>
  );

  // Grafik için formatXAxis fonksiyonunu güncelle
  const formatChartTimestamp = (value: string) => {
    try {
      // Timestamp'i UTC olarak parse et
      const [datePart, timePart] = value.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes] = timePart.split(':');
      
      const utcDate = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      ));
      
      if (selectedRange === '1h' || selectedRange === '6h' || selectedRange === '12h' || selectedRange === '24h') {
        // Saat gösterimi için UTC kullan
        return utcDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        });
      } else {
        // Tarih gösterimi için UTC kullan
        return utcDate.toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          timeZone: 'UTC'
        });
      }
    } catch (e) {
      console.error('Chart date formatting error:', e);
      return value;
    }
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
          
          .custom-tab {
            padding: 10px 16px;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .custom-tab.active {
            background-color: white;
            border-bottom: 3px solid #3182CE;
            font-weight: 600;
          }
          
          .custom-tab:hover:not(.active) {
            background-color: #EDF2F7;
            border: 0px !important;
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

        {/* Dashboard Header - always visible */}
        <Flex 
          justify="space-between" 
          align="center" 
          mb={8}
          pb={3}
          borderBottomWidth="2px"
          borderBottomColor="gray.200"
          direction={{ base: "column", md: "row" }}
          gap={{ base: 4, md: 0 }}
        >
          <Heading 
            as="h1" 
            size={{ base: "lg", md: "xl" }}
            color="green.600"
            display="flex"
            alignItems="center"
            textAlign={{ base: "center", md: "left" }}
            width={{ base: "100%", md: "auto" }}
          >
            <Box mr={3}>{icons.barChart({ boxSize: { base: 5, md: 6 } })}</Box> Via GreenHouse Dashboard
          </Heading>
          
          <Flex 
            align="center" 
            gap={4}
            width={{ base: "100%", md: "auto" }}
            justify={{ base: "center", md: "flex-end" }}
            flexWrap="wrap"
          >
            <Box
              bg={data?.prediction === 'Normal' ? 'green.100' : 
                data?.prediction === 'Warning' ? 'orange.100' : 'red.100'}
              p={{ base: 2, md: 3 }}
              borderRadius="lg"
              display="flex"
              alignItems="center"
              gap={2}
              width={{ base: "100%", md: "auto" }}
              justifyContent={{ base: "center", md: "flex-start" }}
            >
              <Flex direction="row" align="center" gap={2} flexWrap="wrap" justify="center">
                {data?.prediction === 'Normal' ? icons.checkCircle({ 
                  boxSize: { base: 4, md: 5 },
                  color: 'green.500'
                }) : data?.prediction === 'Warning' ? icons.alertTriangle({
                  boxSize: { base: 4, md: 5 },
                  color: 'orange.500'
                }) : icons.alertCircle({
                  boxSize: { base: 4, md: 5 },
                  color: 'red.500'
                })}
                <Text 
                  fontWeight="bold"
                  fontSize={{ base: "sm", md: "md" }}
                  color={data?.prediction === 'Normal' ? 'green.500' : 
                    data?.prediction === 'Warning' ? 'orange.500' : 'red.500'}
                  textAlign={{ base: "center", md: "left" }}
                >
                  {data?.prediction || 'Loading...'} - {data?.prediction === 'Normal' ? 'All parameters in safe range' : 
                   data?.prediction === 'Warning' ? 'Some parameters near thresholds' : 
                   data?.prediction === 'Alert' ? 'Immediate action required!' : 'Loading...'}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Flex>
        
        {/* Current Sensor Data Section */}
        <Box mb={8}>
          <Flex align="center" mb={4} justify={{ base: "center", md: "flex-start" }}>
            <Heading as="h2" size={{ base: "md", md: "lg" }} color="blue.500">
              Current Sensor Data
            </Heading>
          </Flex>
      
          <SimpleGrid 
            columns={{ base: 1, sm: 2, md: 4 }} 
            gap={{ base: 4, md: 6 }} 
            mb={6}
          >
            {/* Temperature Card */}
            {loading ? (
              <CardSkeleton />
            ) : (
              <Box
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                _active={{ transform: 'scale(0.98)' }}
                width="100%"
              >
                <Box
                  bg="white"
                  p={{ base: 4, md: 6 }}
                  borderRadius="xl"
                  boxShadow="md"
                  borderLeftWidth="4px"
                  borderLeftColor={ensureNumber(data?.temperature || 0) > 27 ? 'red.400' : 
                    ensureNumber(data?.temperature || 0) < 20 ? 'blue.400' : 'green.400'}
                  height="100%"
                  width="100%"
                >
                  <Flex 
                    align="center" 
                    mb={4} 
                    direction="row"
                    textAlign="left"
                    gap={4}
                    width="100%"
                  >
                    <Box
                      bg={ensureNumber(data?.temperature || 0) > 27 ? 'red.100' : 
                        ensureNumber(data?.temperature || 0) < 20 ? 'blue.100' : 'green.100'}
                      p={{ base: 4, md: 4 }}
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      width={{ base: "60px", md: "80px" }}
                      height={{ base: "60px", md: "80px" }}
                    >
                      {icons.thermometer({ 
                        boxSize: { base: 8, md: 10 },
                        color: ensureNumber(data?.temperature || 0) > 27 ? 'red.500' : 
                          ensureNumber(data?.temperature || 0) < 20 ? 'blue.500' : 'green.500'
                      })}
                    </Box>
                    <Box flex="1">
                      <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} color="gray.600">Temperature</Text>
                      <Text 
                        fontSize={{ base: "2xl", md: "3xl" }} 
                        fontWeight="bold"
                        textAlign="left"
                        color={ensureNumber(data?.temperature || 0) > 27 ? 'red.500' : 
                          ensureNumber(data?.temperature || 0) < 20 ? 'blue.500' : 'green.500'}
                      >
                        {ensureNumber(data?.temperature || 0).toFixed(1)}°C
                      </Text>
                    </Box>
                  </Flex>
                  
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mt={2} textAlign="left">
                    Ideal range: <Badge colorScheme="green">18-30°C</Badge>
                  </Text>
                </Box>
              </Box>
            )}
        
            {/* Humidity Card */}
            {loading ? (
              <CardSkeleton />
            ) : (
              <Box
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                _active={{ transform: 'scale(0.98)' }}
                width="100%"
              >
                <Box
                  bg="white"
                  p={{ base: 4, md: 6 }}
                  borderRadius="xl"
                  boxShadow="md"
                  borderLeftWidth="4px"
                  borderLeftColor={ensureNumber(data?.humidity || 0) > 65 ? 'red.400' : 
                    ensureNumber(data?.humidity || 0) < 50 ? 'blue.400' : 'green.400'}
                  height="100%"
                  width="100%"
                >
                  <Flex 
                    align="center" 
                    mb={4} 
                    direction="row"
                    textAlign="left"
                    gap={4}
                    width="100%"
                  >
                    <Box
                      bg={ensureNumber(data?.humidity || 0) > 65 ? 'red.100' : 
                        ensureNumber(data?.humidity || 0) < 50 ? 'blue.100' : 'green.100'}
                      p={{ base: 4, md: 4 }}
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      width={{ base: "60px", md: "80px" }}
                      height={{ base: "60px", md: "80px" }}
                    >
                      {icons.droplet({ 
                        boxSize: { base: 8, md: 10 },
                        color: ensureNumber(data?.humidity || 0) > 65 ? 'red.500' : 
                          ensureNumber(data?.humidity || 0) < 50 ? 'blue.500' : 'green.500'
                      })}
                    </Box>
                    <Box flex="1">
                      <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} color="gray.600">Air + Soil Humidity</Text>
                      <Flex align="center" gap={2}>
                        <Text 
                          fontSize={{ base: "2xl", md: "3xl" }} 
                          fontWeight="bold"
                          color={ensureNumber(data?.humidity || 0) > 65 ? 'red.500' : 
                            ensureNumber(data?.humidity || 0) < 50 ? 'blue.500' : 'green.500'}
                        >
                          {ensureNumber(data?.humidity || 0).toFixed(1)}%
                        </Text>
                        <Text fontSize={{ base: "xl", md: "2xl" }} color="gray.400">|</Text>
                        <Text 
                          fontSize={{ base: "2xl", md: "3xl" }} 
                          fontWeight="bold"
                          color={ensureNumber(data?.soil_humidity || 0) > 65 ? 'red.500' : 
                            ensureNumber(data?.soil_humidity || 0) < 50 ? 'blue.500' : 'green.500'}
                        >
                          {ensureNumber(data?.soil_humidity || 0).toFixed(1)}%
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                  
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mt={2} textAlign="left">
                    Ideal range: <Badge colorScheme="green">45-70%</Badge>
                  </Text>
                </Box>
              </Box>
            )}

            {/* CO2 Level Card */}
            {loading ? (
              <CardSkeleton />
            ) : (
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
                  borderLeftColor={ensureNumber(data?.co2_level || 0) > 1000 ? 'red.400' : 
                    ensureNumber(data?.co2_level || 0) < 400 ? 'blue.400' : 'green.400'}
                  height="100%"
                >
                  <Flex align="center" mb={4}>
                    <Box
                      bg={ensureNumber(data?.co2_level || 0) > 1000 ? 'red.100' : 
                        ensureNumber(data?.co2_level || 0) < 400 ? 'blue.100' : 'green.100'}
                      p={4}
                      borderRadius="lg"
                      mr={4}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {icons.co2({ 
                        boxSize: 10,
                        color: ensureNumber(data?.co2_level || 0) > 1000 ? 'red.500' : 
                          ensureNumber(data?.co2_level || 0) < 400 ? 'blue.500' : 'green.500'
                      })}
                    </Box>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" color="gray.600" textAlign="left">CO₂ Level</Text>
                      <Text 
                        fontSize="3xl" 
                        fontWeight="bold"
                        color={ensureNumber(data?.co2_level || 0) > 1000 ? 'red.500' : 
                          ensureNumber(data?.co2_level || 0) < 400 ? 'blue.500' : 'green.500'}
                      >
                        {ensureNumber(data?.co2_level || 0).toFixed(0)} ppm
                      </Text>
                    </Box>
                  </Flex>
                  
                  <Text fontSize="sm" color="gray.500" mt={2} textAlign="left">
                    Ideal range: <Badge colorScheme="green">400-1000 ppm</Badge>
                  </Text>
                </Box>
              </Box>
            )}
        
            {/* Light Level Card */}
            {loading ? (
              <CardSkeleton />
            ) : (
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
                  borderLeftColor={ensureNumber(data?.light_lux || 0) > 10000 ? 'red.400' : 
                    ensureNumber(data?.light_lux || 0) < 2000 ? 'red.400' : 'green.400'}
                  height="100%"
                >
                  <Flex align="center" mb={4}>
                    <Box
                      bg={ensureNumber(data?.light_lux || 0) > 10000 ? 'red.100' : 
                        ensureNumber(data?.light_lux || 0) < 2000 ? 'red.100' : 'green.100'}
                      p={4}
                      borderRadius="lg"
                      mr={4}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {icons.light({ 
                        boxSize: 10,
                        color: ensureNumber(data?.light_lux || 0) > 10000 ? 'red.500' : 
                          ensureNumber(data?.light_lux || 0) < 2000 ? 'red.500' : 'green.500'
                      })}
                    </Box>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" color="gray.600">Light Level</Text>
                      <Text 
                        fontSize="3xl" 
                        fontWeight="bold"
                        color={ensureNumber(data?.light_lux || 0) > 10000 ? 'red.500' : 
                          ensureNumber(data?.light_lux || 0) < 2000 ? 'red.500' : 'green.500'}
                      >
                        {ensureNumber(data?.light_lux || 0).toFixed(0)} lux
                      </Text>
                    </Box>
                  </Flex>
                  
                  <Text fontSize="sm" color="gray.500" mt={2} textAlign="left">
                    Ideal range: <Badge colorScheme="green">2000-10000 lux</Badge>
                  </Text>
                </Box>
              </Box>
            )}
          </SimpleGrid>
      
          {!loading && (
            <Flex justifyContent="flex-end" align="center" mt={2}>
              <Box mr={2}>{icons.clock({ boxSize: 4, color: "gray.500" })}</Box>
              <Text fontSize="sm" color="gray.500" mr={3}>
                Last updated: {data ? (() => {
                  try {
                    // Veritabanından gelen timestamp'i UTC olarak işle
                    const timestamp = data.timestamp;
                    console.log('Raw timestamp from database:', timestamp);
                    
                    // Timestamp'i UTC olarak parse et
                    const [datePart, timePart] = timestamp.split('T');
                    const [year, month, day] = datePart.split('-');
                    const [hours, minutes, seconds] = timePart.split(':');
                    
                    // UTC olarak yeni bir tarih oluştur
                    const utcDate = new Date(Date.UTC(
                      parseInt(year),
                      parseInt(month) - 1,
                      parseInt(day),
                      parseInt(hours),
                      parseInt(minutes),
                      parseInt(seconds)
                    ));
                    
                    console.log('UTC Date:', utcDate.toISOString());
                    
                    // UTC tarihini yerel formatta göster
                    return utcDate.toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                      timeZone: 'UTC' // UTC olarak göster
                    });
                  } catch (e) {
                    console.error('Date formatting error:', e);
                    return data.timestamp;
                  }
                })() : 'Loading...'}
              </Text>
              
              <Badge colorScheme="blue" borderRadius="full" px={3}>
                {formatTimeAgo(secondsAgo)}
              </Badge>
            </Flex>
          )}
        </Box>
        
        {/* Historical Data Section with Tabs */}
        <Box
          bg="white"
          borderRadius="xl"
          p={{ base: 4, md: 6 }}
          boxShadow="md"
          mb={8}
          borderWidth="1px"
          borderColor="gray.200"
          overflowX="auto"
        >
          <Flex 
            justify="space-between" 
            align="center" 
            mb={5}
            direction={{ base: "column", md: "row" }}
            gap={{ base: 4, md: 0 }}
          >
            <Heading as="h2" size={{ base: "sm", md: "md" }} color="blue.500" display="flex" alignItems="center">
              <Box mr={2}>{icons.barChart({ boxSize: { base: 4, md: 5 } })}</Box> Historical Data
            </Heading>
            
            <Stack 
              direction={{ base: "column", sm: "row" }} 
              gap={{ base: 3, md: 4 }} 
              align="center"
              width={{ base: "100%", md: "auto" }}
              flexWrap={{ base: "wrap", md: "nowrap" }}
            >
              <Flex 
                align="center" 
                gap={2}
                minWidth={{ base: "100%", sm: "auto" }}
                flexShrink={0}
              >
                <Text color="gray.600" fontWeight="medium" fontSize={{ base: "sm", md: "md" }} whiteSpace="nowrap">Time Range:</Text>
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
                    maxWidth: "200px",
                    minWidth: "150px"
                  }}
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Flex>
              
              {/* Auto Refresh Switch */}
              <Flex 
                align="center" 
                gap={2} 
                minWidth={{ base: "100%", sm: "auto" }}
                flexShrink={0}
              >
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" whiteSpace="nowrap">Auto Refresh:</Text>
                <Box
                  as="button"
                  onClick={toggleAutoRefresh}
                  bg={autoRefresh ? "blue.500" : "gray.200"}
                  w="40px"
                  h="20px"
                  borderRadius="full"
                  position="relative"
                  transition="all 0.2s"
                  _hover={{ opacity: 0.8 }}
                  flexShrink={0}
                >
                  <Box
                    position="absolute"
                    top="2px"
                    left={autoRefresh ? "22px" : "2px"}
                    w="16px"
                    h="16px"
                    bg="white"
                    borderRadius="full"
                    transition="all 0.2s"
                    boxShadow="sm"
                  />
                </Box>
              </Flex>
              
              <Button 
                onClick={() => {
                  setHistoryLoading(true);
                  fetchHistoricalData();
                }} 
                size={{ base: "sm", md: "md" }}
                colorScheme="blue"
                disabled={historyLoading}
                minWidth={{ base: "100%", sm: "auto" }}
                flexShrink={0}
              >
                {historyLoading ? (
                  <Flex align="center" justify="center" width="100%">
                    <Spinner size="xs" mr={2} />
                    Updating...
                  </Flex>
                ) : (
                  <Flex as="span" alignItems="center" justify="center" width="100%">
                    {icons.refresh({ boxSize: { base: 3, md: 4 }, mr: 2 })}
                    Refresh
                  </Flex>
                )}
              </Button>
            </Stack>
          </Flex>
          
          {!historyLoading && historicalData.length > 0 && (
            <Badge 
              mb={4} 
              p={2} 
              borderRadius="md"
              colorScheme="blue"
              variant="subtle"
              fontSize={{ base: "xs", md: "sm" }}
              display="block"
              textAlign={{ base: "center", md: "left" }}
            >
              {getDateRangeText()} ({historicalData.length} data points shown)
            </Badge>
          )}
          
          {historyLoading ? (
            <ChartSkeleton />
          ) : noDataInRange ? (
            <Box p={5} bg="blue.50" borderRadius="md" color="blue.700">
              <Flex align="center" mb={2}>
                {icons.alertCircle({ boxSize: 5, color: "blue.500", mr: 2 })}
                <Text fontWeight="bold">No Data Available</Text>
              </Flex>
              <Text>No data available for the selected time range. Please try a different range.</Text>
            </Box>
          ) : (
            <>
              {/* Custom Tabs Implementation */}
              <Flex 
                borderBottom="1px solid" 
                borderColor="gray.200" 
                mb={4}
                overflowX="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                  },
                }}
              >
                <Box 
                  className={`custom-tab ${activeTab === 0 ? 'active' : ''}`}
                  onClick={() => setActiveTab(0)}
                  minWidth="120px"
                  textAlign="center"
                >
                  Temperature
                </Box>
                <Box 
                  className={`custom-tab ${activeTab === 1 ? 'active' : ''}`}
                  onClick={() => setActiveTab(1)}
                  minWidth="120px"
                  textAlign="center"
                >
                  Air Humidity
                </Box>
                <Box 
                  className={`custom-tab ${activeTab === 2 ? 'active' : ''}`}
                  onClick={() => setActiveTab(2)}
                  minWidth="120px"
                  textAlign="center"
                >
                  Soil Humidity
                </Box>
                <Box 
                  className={`custom-tab ${activeTab === 3 ? 'active' : ''}`}
                  onClick={() => setActiveTab(3)}
                  minWidth="120px"
                  textAlign="center"
                >
                  CO₂ Level
                </Box>
                <Box 
                  className={`custom-tab ${activeTab === 4 ? 'active' : ''}`}
                  onClick={() => setActiveTab(4)}
                  minWidth="120px"
                  textAlign="center"
                >
                  Light Level
                </Box>
              </Flex>
              
              {/* Tab Panels */}
              <Box display={activeTab === 0 ? 'block' : 'none'}>
                <ChakraLineChart 
                  key={`temp-chart-${selectedRange}-${historicalData.length}`}
                  data={historicalData} 
                  xAxisKey="timestamp" 
                  yAxisKeys={[{ key: 'temperature', color: '#ff6b6b', name: 'Temperature (°C)' }]}
                  height={400}
                  title="Temperature Trend"
                  isLoading={historyLoading}
                  referencePoints={[
                    { y: 18, label: 'Min Ideal (18°C)', color: '#2d5ee6ba', strokeDasharray: '5 5' },
                    { y: 30, label: 'Max Ideal (30°C)', color: '#e62d2dba', strokeDasharray: '5 5' },
                    { y: 25, label: 'Optimal (25°C)', color: '#48e62dba' }
                  ]}
                  formatXAxis={formatChartTimestamp}
                />
              </Box>
              
              <Box display={activeTab === 1 ? 'block' : 'none'}>
                <ChakraLineChart 
                  key={`air-humidity-chart-${selectedRange}-${historicalData.length}`}
                  data={historicalData} 
                  xAxisKey="timestamp" 
                  yAxisKeys={[{ key: 'humidity', color: '#3182CE', name: 'Air Humidity (%)' }]}
                  height={400}
                  title="Air Humidity Trend"
                  isLoading={historyLoading}
                  referencePoints={[
                    { y: 65, label: 'Max Ideal (65%)', color: '#2d5ee6ba', strokeDasharray: '5 5' },
                    { y: 50, label: 'Min Ideal (50%)', color: '#e62d2dba', strokeDasharray: '5 5' },
                    { y: 45, label: 'Optimal (45%)', color: '#48e62dba' }
                  ]}
                  formatXAxis={formatChartTimestamp}
                />
              </Box>
              
              <Box display={activeTab === 2 ? 'block' : 'none'}>
                <ChakraLineChart 
                  key={`soil-humidity-chart-${selectedRange}-${historicalData.length}`}
                  data={historicalData} 
                  xAxisKey="timestamp" 
                  yAxisKeys={[{ key: 'soil_humidity', color: '#3182CE', name: 'Soil Humidity (%)' }]}
                  height={400}
                  title="Soil Humidity Trend"
                  isLoading={historyLoading}
                  referencePoints={[
                    { y: 65, label: 'Max Ideal (65%)', color: '#2d5ee6ba', strokeDasharray: '5 5' },
                    { y: 50, label: 'Min Ideal (50%)', color: '#e62d2dba', strokeDasharray: '5 5' },
                    { y: 45, label: 'Optimal (45%)', color: '#48e62dba' }
                  ]}
                  formatXAxis={formatChartTimestamp}
                />
              </Box>
              
              <Box display={activeTab === 3 ? 'block' : 'none'}>
                <ChakraLineChart 
                  key={`co2-chart-${selectedRange}-${historicalData.length}`}
                  data={historicalData} 
                  xAxisKey="timestamp" 
                  yAxisKeys={[{ key: 'co2_level', color: '#3182CE', name: 'CO₂ Level (ppm)' }]}
                  height={400}
                  title="CO₂ Level Trend"
                  isLoading={historyLoading}
                  referencePoints={[
                    { y: 1000, label: 'Max Ideal (1000 ppm)', color: '#2d5ee6ba', strokeDasharray: '5 5' },
                    { y: 400, label: 'Min Ideal (400 ppm)', color: '#e62d2dba', strokeDasharray: '5 5' },
                    { y: 900, label: 'Optimal (900 ppm)', color: '#48e62dba' }
                  ]}
                  formatXAxis={formatChartTimestamp}
                />
              </Box>
              
              <Box display={activeTab === 4 ? 'block' : 'none'}>
                <ChakraLineChart 
                  key={`light-chart-${selectedRange}-${historicalData.length}`}
                  data={historicalData} 
                  xAxisKey="timestamp" 
                  yAxisKeys={[{ key: 'light_lux', color: '#FFD700', name: 'Light Level (lux)' }]}
                  height={400}
                  title="Light Level Trend"
                  isLoading={historyLoading}
                  referencePoints={[
                    { y: 10000, label: 'Max Ideal (10000 lux)', color: '#2d5ee6ba', strokeDasharray: '5 5' },
                    { y: 2000, label: 'Min Ideal (2000 lux)', color: '#e62d2dba', strokeDasharray: '5 5' },
                    { y: 8000, label: 'Optimal (8000 lux)', color: '#48e62dba' }
                  ]}
                  formatXAxis={formatChartTimestamp}
                />
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;