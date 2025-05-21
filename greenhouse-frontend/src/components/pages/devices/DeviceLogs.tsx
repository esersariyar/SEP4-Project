import React, { useState, useEffect, useRef } from 'react';
import {
  Box, 
  Heading,
  Text,
  Flex,
  Badge,
  Button,
  Input,
  Select,
  Spinner
} from '@chakra-ui/react';

// Add a simple toast implementation since we have import issues
const toast = (props: { title: string; description: string; status: string; duration: number; isClosable: boolean }) => {
  // Silent toast, no console logs
};

// Helper function to get user data from localStorage
const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

interface DeviceLog {
  id: number;
  device_id: number;
  user_id?: number;
  username?: string;
  action_type: 'value_change' | 'status_change';
  old_value?: string;
  new_value: string;
  log_time: string;
  timeAgo: string;
  actionDisplay: string;
  formattedTime: string;
}

interface Device {
  id: number;
  name: string;
  type: string;
}

interface DeviceLogsProps {
  showTitle?: boolean;
  initialDeviceId?: number;
  compact?: boolean;
}

const DeviceLogs: React.FC<DeviceLogsProps> = ({ 
  showTitle = true, 
  initialDeviceId,
  compact = false 
}) => {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Refs for smooth updates
  const previousLogsRef = useRef<DeviceLog[]>([]);
  
  // Filter states
  const [selectedDevice, setSelectedDevice] = useState<string>(initialDeviceId ? initialDeviceId.toString() : 'all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [limit, setLimit] = useState<number>(compact ? 10 : 100);
  
  // Auto-refresh interval (in milliseconds)
  const refreshInterval = 5000; // 5 seconds for more frequent updates

  // Fetch device logs
  const fetchLogs = async () => {
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (selectedDevice !== 'all') {
        params.append('deviceId', selectedDevice);
      }
      
      if (selectedActionType !== 'all') {
        params.append('actionType', selectedActionType);
      }
      
      params.append('limit', limit.toString());
      
      // Get auth token for API request
      const token = getAuthToken();
      
      // Fetch logs from API with authentication
      const response = await fetch(
        selectedDevice !== 'all' 
          ? `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/devices/${selectedDevice}/logs?${params.toString()}`
          : `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/devices/logs?${params.toString()}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch device logs');
      }
      
      const data = await response.json();
      
      // Ensure we have user information for each log
      const user = getUserData();
      const processedLogs = data.logs.map((log: DeviceLog) => {
        // If log doesn't have username but we have logged in user, assign it
        if (!log.username && user && (log.user_id === user.id || !log.user_id)) {
          return {
            ...log,
            username: user.username,
            user_id: user.id
          };
        }
        return log;
      });
      
      // Store current logs in ref before updating
      previousLogsRef.current = logs;

      // Check for new logs and update smoothly
      if (!isInitialLoad) {
        // Find new logs by comparing IDs
        const existingLogIds = new Set(logs.map(log => log.id));
        const newLogs = processedLogs.filter((log: DeviceLog) => !existingLogIds.has(log.id));
        
        if (newLogs.length > 0) {
          // Merge new logs with existing logs, respecting the limit
          const combinedLogs = [...newLogs, ...logs].slice(0, limit);
          setLogs(combinedLogs);
        }
      } else {
        // First load, just set all logs
        setLogs(processedLogs);
        setIsInitialLoad(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to fetch device logs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch devices for filter dropdown
  const fetchDevices = async () => {
    try {
      // Get auth token for API request
      const token = getAuthToken();
      
      const response = await fetch(
        `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/devices`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to fetch devices for filtering',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Load logs and devices on component mount and set up refresh interval
  useEffect(() => {
    fetchDevices();
    fetchLogs();
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      fetchLogs();
    }, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [initialDeviceId]);
  
  // Get device name by ID
  const getDeviceName = (deviceId: number): string => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : `Device ${deviceId}`;
  };
  
  // Apply filters
  const handleFilterApply = () => {
    setIsInitialLoad(true); // Reset to initial load mode when filters change
    fetchLogs();
  };
  
  // Reset filters
  const handleFilterReset = () => {
    // If initialDeviceId is provided, don't reset to 'all'
    setSelectedDevice(initialDeviceId ? initialDeviceId.toString() : 'all');
    setSelectedActionType('all');
    setLimit(compact ? 10 : 100);
    setIsInitialLoad(true); // Reset to initial load mode when filters change
    
    // Wait for state to update, then fetch logs
    setTimeout(() => {
      fetchLogs();
    }, 0);
  };
  
  // Get status color based on value
  const getStatusColor = (oldValue: string | undefined, newValue: string): string => {
    if (newValue === 'Active' || newValue === 'ON') {
      return 'green.500';
    } else if (newValue === 'Inactive' || newValue === 'OFF') {
      return 'red.500';
    }
    return 'blue.500'; // Default for value changes
  };
  
  // Render action badge
  const renderActionBadge = (actionType: string, oldValue?: string, newValue?: string) => {
    if (actionType === 'value_change') {
      return <Badge colorScheme="blue">Value Updated</Badge>;
    } else if (actionType === 'status_change') {
      return <Badge colorScheme={newValue === 'Active' ? "green" : "red"}>Status Changed</Badge>;
    }
    return <Badge>{actionType}</Badge>;
  };
  
  if (loading && logs.length === 0) {
    return (
      <Flex justifyContent="center" alignItems="center" h="100px">
        <Spinner />
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Box textAlign="center" p={4} color="red.500">
        <Text>{error}</Text>
        <Button mt={2} size="sm" onClick={fetchLogs}>Try Again</Button>
      </Box>
    );
  }
  
  if (logs.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Text color="gray.500">No logs found</Text>
      </Box>
    );
  }
  
  return (
    <Box>
      {showTitle && (
        <Heading size="md" mb={4}>Device Activity Logs</Heading>
      )}
      
      <Box maxH={compact ? "300px" : "600px"} overflowY="auto">
        {logs.map(log => (
          <Box 
            key={log.id} 
            p={3} 
            mb={2} 
            borderWidth="1px" 
            borderRadius="md"
            borderLeftWidth="4px"
            borderLeftColor={
              log.action_type === 'status_change' 
                ? (log.new_value === 'Active' ? 'green.400' : 'red.400')
                : 'blue.400'
            }
            // Add subtle animation for new logs
            data-isnew={previousLogsRef.current.findIndex(l => l.id === log.id) === -1 ? 'true' : 'false'}
            animation={previousLogsRef.current.findIndex(l => l.id === log.id) === -1 ? 
              "fadeIn 0.5s ease-in" : undefined}
          >
            <Box width="100%">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex alignItems="center">
                  <Text fontWeight="bold" fontSize="md" color="gray.700">
                    {getDeviceName(log.device_id)}
                  </Text>
                  {log.username ? (
                    <Text fontSize="xs" color="gray.500" ml={2} fontStyle="italic">
                      by {log.username}
                    </Text>
                  ) : (
                    <Text fontSize="xs" color="gray.500" ml={2} fontStyle="italic">
                      by System
                    </Text>
                  )}
                </Flex>
                <Text fontSize="sm" color="gray.500">
                  {log.timeAgo}
                </Text>
              </Flex>
              
              <Flex alignItems="center" mt={2}>
                {renderActionBadge(log.action_type, log.old_value, log.new_value)}
                <Text ml={2} fontSize="sm">
                  {log.action_type === 'value_change' 
                    ? `Value changed from ${log.old_value || '-'} to `
                    : `Status changed from ${log.old_value || '-'} to `
                  }
                  <Text 
                    as="span" 
                    fontWeight="bold" 
                    color={getStatusColor(log.old_value, log.new_value)}
                  >
                    {log.new_value}
                  </Text>
                </Text>
              </Flex>
            </Box>
          </Box>
        ))}
      </Box>
      
      {!compact && (
        <Flex justifyContent="space-between" alignItems="center" mt={4}>
          <Text fontSize="xs" color="gray.500">
            Logs update automatically
          </Text>
          <Button size="sm" onClick={fetchLogs} disabled={loading}>
            Refresh Now
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default DeviceLogs; 