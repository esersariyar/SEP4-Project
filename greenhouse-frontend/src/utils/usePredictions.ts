import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PredictionData, Ranges, Insight, ChartDataItem } from '../components/pages/predictions/types'; // Adjusted path

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Re-define or import constants if they are not passed as props (e.g., ranges for insights)
// For simplicity, we will redefine ranges here if it's only used for insights generation within the hook
// Or, the hook could accept `ranges` as an argument if it's dynamic or shared elsewhere for rendering.
// Assuming `ranges` constant is primarily for insight generation logic and color coding.
const rangesConstant: Ranges = {
  temp: { min: 15, max: 35, ideal: { min: 22, max: 28 } },
  air_humidity: { min: 35, max: 75, ideal: { min: 50, max: 65 } },
  soil_humidity: { min: 30, max: 70, ideal: { min: 45, max: 60 } },
  co2_level: { min: 400, max: 1500, ideal: { min: 700, max: 1200 } },
  light_lux: { min: 0, max: 2000, ideal: { min: 800, max: 1800 } }
};

export const usePredictions = (initialSelectedRange: string = '24h', initialSelectedSensorType: string = 'temp') => {
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>(initialSelectedRange);
  const [selectedSensorType, setSelectedSensorType] = useState<string>(initialSelectedSensorType); // Added this state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('unknown');
  const [messageText, setMessageText] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const isFirstRender = useRef<boolean>(true);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessageText(text);
    setMessageType(type);
    setTimeout(() => {
      setMessageText(null);
      setMessageType(null);
    }, 5000);
  }, []);

  const parseDate = useCallback((dateStr: string): Date => {
    try {
      if (dateStr.includes(' ') && dateStr.indexOf('-') === 4 && dateStr.length === 19) {
        const isoUtcStr = dateStr.replace(' ', 'T') + 'Z';
        const date = new Date(isoUtcStr);
        if (!isNaN(date.getTime())) return date;
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
        if (!isNaN(utcDateFromParts.getTime())) return utcDateFromParts;
      }
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
      console.warn(`Failed to parse date string: ${dateStr}, falling back to current date.`);
      return new Date();
    } catch (e) {
      console.error(`Error parsing date string: ${dateStr}`, e);
      return new Date();
    }
  }, []);

  const fetchPredictions = useCallback(async (rangeToFetch: string) => {
    setError(null);
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/predictions?range=${rangeToFetch}`);
      if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText || 'Failed to fetch'}`);
      const data = await response.json();
      if (data.empty === true) {
        setPredictionData([]);
        setDataSource('empty database');
      } else if (data.data && data.data.length > 0) {
        setPredictionData(data.data);
        setLastUpdated(new Date());
        if (data._source) setDataSource(data._source);
      } else {
        setPredictionData([]);
        setDataSource('no data'); 
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setPredictionData([]);
      setDataSource('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [setError, setIsRefreshing, setPredictionData, setDataSource, setLastUpdated]);

  const getHoursFromRange = useCallback((range: string): number => {
    switch (range) {
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case '3d': return 72;
      case '7d': return 168;
      default: return 24;
    }
  }, []);

  const handleGeneratePredictions = useCallback(async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/predictions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(`HTTP Error: ${response.status} - ${result.message || 'Unknown error'}`);
      showMessage(result.message || "New predictions were generated successfully!", 'success');
      fetchPredictions(selectedRange); // refetch after generating
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate prediction data";
      setError(errorMessage);
      showMessage(errorMessage, 'error');
      setPredictionData([]); // Clear data on error
      setDataSource('error');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, selectedRange, fetchPredictions, showMessage, API_URL]);
  
  const handleRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    setSelectedRange(newRange);
    // Fetching will be triggered by useEffect watching selectedRange
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchPredictions(initialSelectedRange);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPredictions, initialSelectedRange]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPredictions(selectedRange);
  }, [selectedRange, fetchPredictions]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchPredictions(selectedRange);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [selectedRange, fetchPredictions]);

  const processedChartData = useMemo((): ChartDataItem[] => {
    if (!predictionData.length) return [];
    const internalParseDateForSort = (dateStr: string): Date => parseDate(dateStr);
    const processedData = predictionData
      .map(item => {
        const parsedDt = internalParseDateForSort(item.timestamp);
        return {
          ...item,
          parsedDate: parsedDt,
          timestamp: item.timestamp,
          ms: parsedDt.getTime()
        };
      })
      .sort((a, b) => a.ms - b.ms);
    const hours = getHoursFromRange(selectedRange);
    const now = new Date();
    const endTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    const nowMs = now.getTime();
    const endTimeMs = endTime.getTime();
    const filteredData = processedData.filter(item => item.ms >= nowMs && item.ms <= endTimeMs);
    
    return filteredData.map(item => ({
      timestamp: item.timestamp,
      date: item.parsedDate,
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
  }, [predictionData, selectedSensorType, selectedRange, parseDate, getHoursFromRange]);

  const currentReading = useMemo(() => {
    if (!predictionData.length) return null;

    const nowMs = new Date().getTime();
    // Reverted logic: Find the soonest future prediction
    const futurePredictions = predictionData
        .map(p => ({ ...p, ms: parseDate(p.timestamp).getTime() })) // Ensure timestamp is parsed to ms for comparison
        .filter(p => p.ms >= nowMs) // Filter for predictions that are now or in the future
        .sort((a,b) => a.ms - b.ms); // Sort by time ascending
    
    return futurePredictions.length > 0 ? futurePredictions[0] : null; // Return the very first one
  }, [predictionData, parseDate]);

  const getReadingColor = useCallback((type: string, value: number): string => {
    const rangeKey = type as keyof Ranges;
    const specificRange = rangesConstant[rangeKey]; // Use rangesConstant from hook scope
    if (!specificRange) return '#000000'; // Default color if type is somehow invalid
    if (value < specificRange.ideal.min || value > specificRange.ideal.max) {
      return value < specificRange.min || value > specificRange.max ? '#e74c3c' : '#f39c12';
    }
    return '#2ecc71';
  }, []); // rangesConstant is stable

  const getPredictionRangeText = useCallback((): string => {
    if (!predictionData.length && selectedRange) { /* Allow text even if no data, based on selected range */}
    else if(!predictionData.length) return ''
    
    const now = new Date();
    const selectedHours = getHoursFromRange(selectedRange);
    const endDate = new Date(now.getTime() + selectedHours * 60 * 60 * 1000);
    const startStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const startTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (startStr === endStr) {
      return `${startStr} ${startTimeStr} - ${endTimeStr}`;
    } else {
      return `${startStr} ${startTimeStr} - ${endStr} ${endTimeStr}`;
    }
  }, [selectedRange, getHoursFromRange, predictionData.length]); // dependency on predictionData.length to re-eval if it becomes available

 const generatedInsights = useMemo((): Insight[] => {
    if (!currentReading) return [];
    const insights: Insight[] = [];
    const localRanges = rangesConstant; // Use the hook's constant ranges

    if (currentReading.predicted_temp < localRanges.temp.ideal.min) {
      insights.push({ type: 'warning', icon: '🥶', message: 'Temperature is predicted to drop below ideal range. Consider heating options to protect plants.', sensor: 'temperature' });
    } else if (currentReading.predicted_temp > localRanges.temp.ideal.max) {
      insights.push({ type: 'warning', icon: '🔥', message: 'Temperature is predicted to rise above ideal range. Consider shade or cooling to prevent stress.', sensor: 'temperature' });
    } else {
      insights.push({ type: 'success', icon: '👍', message: 'Temperature is predicted to stay in ideal range. Plants should thrive in these conditions.', sensor: 'temperature' });
    }
    if (currentReading.predicted_air_humidity < localRanges.air_humidity.ideal.min) {
      insights.push({ type: 'warning', icon: '💨', message: 'Air humidity is predicted to be low. Consider using a humidifier or misting plants.', sensor: 'air_humidity' });
    } else if (currentReading.predicted_air_humidity > localRanges.air_humidity.ideal.max) {
      insights.push({ type: 'warning', icon: '💧', message: 'Air humidity is predicted to be high. Improve air circulation to prevent fungal issues.', sensor: 'air_humidity' });
    } else {
      insights.push({ type: 'success', icon: '👍', message: 'Air humidity is predicted to stay in ideal range. Good conditions for most plants.', sensor: 'air_humidity' });
    }
    if (currentReading.predicted_soil_humidity < localRanges.soil_humidity.ideal.min) {
      insights.push({ type: 'warning', icon: '🚿', message: 'Soil is predicted to become dry. Plan to water your plants in the next few hours.', sensor: 'soil_humidity' });
    } else if (currentReading.predicted_soil_humidity > localRanges.soil_humidity.ideal.max) {
      insights.push({ type: 'warning', icon: '💦', message: 'Soil is predicted to be too wet. Hold off on watering and ensure proper drainage.', sensor: 'soil_humidity' });
    } else {
      insights.push({ type: 'success', icon: '👍', message: 'Soil moisture is predicted to stay in ideal range. No watering adjustments needed.', sensor: 'soil_humidity' });
    }
    if (currentReading.predicted_co2_level < localRanges.co2_level.ideal.min) {
      insights.push({ type: 'warning', icon: '🌬️', message: 'CO2 levels are predicted to be low. Consider CO2 supplementation for better plant growth.', sensor: 'co2_level' });
    } else if (currentReading.predicted_co2_level > localRanges.co2_level.ideal.max) {
      insights.push({ type: 'warning', icon: '☁️', message: 'CO2 levels are predicted to be high. Improve ventilation for a better growing environment.', sensor: 'co2_level' });
    } else {
      insights.push({ type: 'success', icon: '👍', message: 'CO2 levels are predicted to stay in ideal range. Excellent for photosynthesis.', sensor: 'co2_level' });
    }
    if (currentReading.predicted_light_lux < localRanges.light_lux.ideal.min) {
      insights.push({ type: 'warning', icon: '🌑', message: 'Light levels are predicted to be low. Consider supplemental lighting for better growth.', sensor: 'light_lux' });
    } else if (currentReading.predicted_light_lux > localRanges.light_lux.ideal.max) {
      insights.push({ type: 'warning', icon: '☀️', message: 'Light levels are predicted to be high. Consider shading to prevent leaf burn.', sensor: 'light_lux' });
    } else {
      insights.push({ type: 'success', icon: '👍', message: 'Light levels are predicted to stay in ideal range. Perfect for healthy plant growth.', sensor: 'light_lux' });
    }
    return insights;
  }, [currentReading]); // rangesConstant is stable

  // Format X-axis for chart (remains specific to how chart consumes it, but uses hook state)
  const formatChartXAxis = useCallback((timeStr: string): string => {
    try {
      const date = parseDate(timeStr);
      if (isNaN(date.getTime())) return 'Invalid';
      if (['6h', '12h', '24h'].includes(selectedRange)) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        });
      } else { 
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        return `${month}/${day}`;
      }
    } catch (e) {
      console.error("Error formatting chart X-axis:", e, "Input:", timeStr);
      return 'Err';
    }
  }, [selectedRange, parseDate]);

  return {
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
    showMessage,
    handleGeneratePredictions,
    handleRangeChange,
    setSelectedSensorType,
    processedChartData,
    currentReading,
    getReadingColor,
    getPredictionRangeText,
    generatedInsights,
    formatChartXAxis,
  };
}; 