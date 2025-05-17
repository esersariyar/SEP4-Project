import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Input,
  SimpleGrid,
  Flex,
  Text,
  Badge,
  HStack,
  Icon,
} from "@chakra-ui/react";
import DeviceLogs from './DeviceLogs';
import { 
  FaLeaf, 
  FaThermometerHalf, 
  FaTint, 
  FaLightbulb, 
  FaFan, 
  FaSearch, 
  FaSeedling, 
  FaFlask,
  FaMicrochip,
  FaRegLightbulb,
} from "react-icons/fa";
import { 
  MdWater, 
  MdOutlineDeviceThermostat, 
  MdSensors, 
  MdOutlineSettings, 
  MdOutlineSettingsRemote, 
  MdTouchApp,
  MdSpeed
} from "react-icons/md";
import { 
  BsDropletHalf, 
  BsThermometerHalf, 
  BsLightbulbFill, 
  BsLightbulb, 
  BsDisplay, 
  BsCpu 
} from "react-icons/bs";
import { IoWater } from "react-icons/io5";

// SVG Icons for fallback if needed
const renderDeviceIcon = (iconType: string, props: any = {}) => {
  const { color, boxSize, ...rest } = props;
  const style = {
    width: typeof boxSize === "number" ? `${boxSize}px` : boxSize || "24px",
    height: typeof boxSize === "number" ? `${boxSize}px` : boxSize || "24px",
    color: color || "currentColor",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    marginRight: rest.mr ? rest.mr + "px" : "0",
    flexShrink: 0,
    ...rest,
  };

  // Convert device name and type to lowercase
  const lowerIconType = iconType.toLowerCase();

  // Icon selection based on sensor and device name (using React Icons)
  if (lowerIconType.includes('temperature')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><BsThermometerHalf /></Icon>;
  } else if (lowerIconType.includes('humidity') && lowerIconType.includes('soil')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><FaSeedling /></Icon>;
  } else if (lowerIconType.includes('humidity')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><BsDropletHalf /></Icon>;
  } else if (lowerIconType.includes('water') || lowerIconType === 'water pump') {
    return <Icon boxSize={boxSize} color={color} {...rest}><IoWater /></Icon>;
  } else if (lowerIconType.includes('light') && !lowerIconType.includes('panel')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><BsLightbulb /></Icon>;
  } else if (lowerIconType.includes('led') || lowerIconType.includes('panel')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><BsLightbulbFill /></Icon>;
  } else if (lowerIconType.includes('fan') || lowerIconType === 'ventilation') {
    return <Icon boxSize={boxSize} color={color} {...rest}><FaFan /></Icon>;
  } else if (lowerIconType.includes('co2')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><FaFlask /></Icon>;
  } else if (lowerIconType.includes('button')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><MdTouchApp /></Icon>;
  } else if (lowerIconType.includes('servo')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><MdOutlineSettings /></Icon>;
  } else if (lowerIconType.includes('segment') || lowerIconType.includes('display')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><BsDisplay /></Icon>;
  } else if (lowerIconType.includes('proximity')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><MdSensors /></Icon>;
  } else if (lowerIconType.includes('pir')) {
    return <Icon boxSize={boxSize} color={color} {...rest}><MdOutlineSettingsRemote /></Icon>;
  } else if (lowerIconType === 'search') {
    return <Icon boxSize={boxSize} color={color} {...rest}><FaSearch /></Icon>;
  } else {
    // Use leaf icon as default
    return <Icon boxSize={boxSize} color={color} {...rest}><FaLeaf /></Icon>;
  }
};

interface BaseDevice {
  id: number;
  name: string;
  type: string;
  status: string;
  icon: string;
  last_update: string;
  isInteractive: boolean;
}

interface SensorDevice extends BaseDevice {
  isInteractive: false;
  value: number;
  unit?: string;
}

interface ActuatorDevice extends BaseDevice {
  isInteractive: true;
  isOn: boolean;
}

type Device = SensorDevice | ActuatorDevice;

// Since it's defined as '/api/devices' in the backend, we only specify the server address here
const API_BASE_URL = "http://localhost:3000";

// Format time ago helper (this is a regular function, not using hooks)
const formatTimeAgo = (timeDiff: number) => {
  const seconds = Math.floor(timeDiff / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

// Status indicator component
const StatusDot = ({ isActive }: { isActive: boolean }) => {
  const bgColor = isActive ? "green.400" : "red.400";
  
  return (
    <Box
      position="absolute"
      top="10px"
      right="10px"
      width="12px"
      height="12px"
      borderRadius="50%"
      bg={bgColor}
      boxShadow={isActive ? "0 0 8px rgba(34, 195, 94, 0.6)" : "0 0 8px rgba(229, 62, 62, 0.6)"}
    />
  );
};

const Devices: React.FC<{}> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  
  // Add a ref to store device update timestamps - properly inside component
  const deviceUpdateTimestamps = useRef<Record<number, number>>({});

  // Initialize with some example logs
  const [activityLog, setActivityLog] = useState<
    { action: string; device: string; timestamp: Date }[]
  >([
    {
      action: "turned on",
      device: "LED Grow Lights",
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    },
    {
      action: "turned off",
      device: "Ventilation Fan",
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    },
    {
      action: "turned on",
      device: "Water Pump - Zone A",
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    },
  ]);

  const fetchDevices = useCallback(async () => {
    try {
      // Just refresh data instead of reloading the whole page
      // setLoading(true); - Only set loading state to true on initial load
      
      // Clean fetch request like in Dashboard component
      const response = await fetch(`${API_BASE_URL}/api/devices`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // UPDATED: Compare with previous devices and only update timestamps for changed devices
      setDevices(prevDevices => {
        // Update timestamps for new devices
        data.forEach((device: Device) => {
          if (!deviceUpdateTimestamps.current[device.id]) {
            deviceUpdateTimestamps.current[device.id] = Date.now();
          } else {
            // Check if any device data has changed to update timestamp
            const prevDevice = prevDevices.find(d => d.id === device.id);
            if (prevDevice) {
              // If it's an actuator, check if isOn status changed
              if (device.isInteractive && prevDevice.isInteractive) {
                const prevActuator = prevDevice as ActuatorDevice;
                const newActuator = device as ActuatorDevice;
                if (prevActuator.isOn !== newActuator.isOn) {
                  deviceUpdateTimestamps.current[device.id] = Date.now();
                }
              } 
              // For sensors, check if value changed
              else if (!device.isInteractive && !prevDevice.isInteractive) {
                const prevSensor = prevDevice as SensorDevice;
                const newSensor = device as SensorDevice;
                if (prevSensor.value !== newSensor.value) {
                  deviceUpdateTimestamps.current[device.id] = Date.now();
                }
              }
            }
          }
        });
        return data;
      });
      
      setError("");
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError("Could not connect to server. Make sure the backend is running.");
      // Only set empty array in case of error, otherwise keep current data
      // setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    // Get data during initial load and set loading state
    setLoading(true);
    fetchDevices();
    
    // Refresh data every 5 seconds but don't reload the page
    const intervalId = setInterval(() => {
      fetchDevices();
    }, 5000);
    
    // Clean up interval when component is unmounted
    return () => clearInterval(intervalId);
  }, [fetchDevices]);

  // Define colors
  const bgGradient = "linear(to-b, green.50, white)";
  const cardBg = "white";
  const cardHoverBg = "gray.50";
  const cardBorder = "gray.200";
  const primaryGreen = "#2e7d32";
  const secondaryGreen = "#22c35e";

  // Filter devices based on search query
  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Toggle device status
  const toggleDevice = useCallback(
    async (id: number) => {
      try {
        setIsUpdating(id);

        // Find the device we're updating
        const device = devices.find((d) => d.id === id) as ActuatorDevice;

        if (!device) {
          throw new Error("Device not found");
        }

        const isOn = !device.isOn;

        // Log this activity for better UX
        const action = isOn ? "turned on" : "turned off";
        setActivityLog((prev) => [
          {
            action,
            device: device.name,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9), // Keep only the 10 most recent logs
        ]);

        // UPDATED: Update timestamp for this device immediately when toggled
        deviceUpdateTimestamps.current[id] = Date.now();

        // Optimistic UI update
        setDevices(
          devices.map((d) => {
            if (d.id === id && d.isInteractive) {
              const actuatorDevice = d as ActuatorDevice;
              return {
                ...actuatorDevice,
                isOn,
                status: isOn ? "Active" : "Inactive",
              };
            }
            return d;
          }),
        );

        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Using token for device toggle:', token ? token.substring(0, 15) + '...' : 'No token found');

        // Get user data from localStorage
        try {
          const userDataStr = localStorage.getItem('user');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            console.log('User data from localStorage:', userData);
          } else {
            console.log('No user data in localStorage');
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
        }

        // Clean API request like in Dashboard
        const response = await fetch(
          `${API_BASE_URL}/api/devices/${id}/toggle`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ 
              status: isOn ? 'on' : 'off' 
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to toggle device: ${response.status}`);
        }

        // Get updated state from server
        const result = await response.json();
        console.log('Toggle device response:', result);

        // Update UI with server state (if different from optimistic update)
        if (result.device) {
          setDevices((prevDevices) =>
            prevDevices.map((d) =>
              d.id === id ? { ...d, ...result.device } : d,
            ),
          );
        }
      } catch (err) {
        console.error("Error toggling device:", err);
        // Revert the optimistic update in case of failure
        setError("Failed to update device status. Please try again.");
        setDevices(
          devices.map((d) => {
            if (d.id === id && d.isInteractive) {
              const actuatorDevice = d as ActuatorDevice;
              return {
                ...actuatorDevice,
                isOn: !actuatorDevice.isOn, // Toggle back
                status: actuatorDevice.isOn ? "Active" : "Inactive",
              };
            }
            return d;
          }),
        );
      } finally {
        setIsUpdating(null);
      }
    },
    [
      API_BASE_URL,
      devices,
      setActivityLog,
      setDevices,
      setError,
      setIsUpdating,
      deviceUpdateTimestamps,
    ],
  );

  // Update last update time for device - this is inside the component
  const getLastUpdateTime = (deviceId: number) => {
    if (!deviceUpdateTimestamps.current[deviceId]) {
      deviceUpdateTimestamps.current[deviceId] = Date.now();
    }
    
    return formatTimeAgo(Date.now() - deviceUpdateTimestamps.current[deviceId]);
  };

  return (
    <Box p={5} bg={bgGradient} minH="calc(100vh - 64px)">
      <Box maxW="1200px" mx="auto">
        {/* Loading & Error States */}
        {loading && (
          <Box textAlign="center" py={10}>
            <Box
              w="40px"
              h="40px"
              borderRadius="50%"
              border="4px solid"
              borderColor="green.200"
              borderTopColor="green.500"
              mx="auto"
              className="spinner"
            />
            <Text mt={4} color="gray.600">
              Loading devices...
            </Text>
          </Box>
        )}

        {error && !loading && (
          <Box
            borderRadius="md"
            mb={6}
            p={4}
            bg="red.50"
            color="red.700"
            borderLeft="4px solid"
            borderLeftColor="red.500"
          >
            <Heading size="sm" mb={1}>
              Error
            </Heading>
            <Text>{error}</Text>
          </Box>
        )}

        {/* Only show content when devices are loaded successfully */}
        {devices.length > 0 && !loading && !error && (
          <>
            <Box textAlign="center" mb={6}>
              <Heading size="lg" color="green.700" mb={2}>
                Greenhouse Devices
              </Heading>
              <Text color="gray.600">
                Monitor and control your greenhouse devices from one central
                location
              </Text>
            </Box>

            {/* Search Box */}
            <Box maxW="500px" mb={8} position="relative" width="100%" mx="auto">
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                zIndex="1"
                color="gray.400"
              >
                <Icon boxSize="14px">
                  <FaSearch />
                </Icon>
              </Box>
              <Input
                placeholder="Search devices..."
                size="lg"
                pl="40px"
                bg={cardBg}
                borderColor={cardBorder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                _hover={{ borderColor: "gray.300" }}
                _focus={{
                  borderColor: primaryGreen,
                  boxShadow: `0 0 0 1px ${primaryGreen}`,
                }}
                borderRadius="md"
              />
            </Box>

            {/* Device Grid */}
            <SimpleGrid columns={{ base: 1, sm: 1, md: 2, lg: 3 }} gap={6} mt={8}>
              {loading
                ? Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <Box
                        key={i}
                        borderWidth="1px"
                        borderRadius="lg"
                        p={6}
                        bg="white"
                        height="220px"
                        opacity={0.7}
                      />
                    ))
                : filteredDevices.map((device) => {
                    const isActive = device.status === 'Active';
                    const isActuator = device.isInteractive;
                    return (
                      <Box
                        key={device.id}
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={cardBorder}
                        p={6}
                        bg={cardBg}
                        _hover={{ 
                          bg: cardHoverBg,
                          transform: "translateY(-5px)",
                          boxShadow: "lg",
                          borderColor: "green.200"
                        }}
                        boxShadow="sm"
                        transition="all 0.3s ease"
                        position="relative"
                        height="220px"
                      >
                        <StatusDot isActive={isActive} />
                        
                        <Flex height="100%" direction="column" justify="space-between">
                          <Flex align="center" mb={4}>
                            <Box
                              p={3}
                              borderRadius="md"
                              bg={
                                device.isInteractive &&
                                (device as ActuatorDevice).isOn
                                  ? "green.50"
                                  : "gray.50"
                              }
                              color={
                                device.isInteractive &&
                                (device as ActuatorDevice).isOn
                                  ? "green.500"
                                  : "gray.500"
                              }
                              mr={4}
                            >
                              {renderDeviceIcon(device.name, { boxSize: 30 })}
                            </Box>
                            <Box>
                              <Text fontSize="xl" fontWeight="600" color="gray.700" mb={1}>
                                {device.name}
                              </Text>
                              <Flex gap={2} alignItems="center">
                                <Badge
                                  colorScheme={
                                    device.isInteractive
                                      ? (device as ActuatorDevice).isOn
                                        ? "green"
                                        : "gray"
                                      : device.status === "Normal"
                                        ? "green"
                                        : "yellow"
                                  }
                                  fontSize="sm"
                                  borderRadius="full"
                                  px={2}
                                  py={0.5}
                                >
                                  {device.status}
                                </Badge>
                                <Text fontSize="sm" color="gray.500">
                                  {device.type}
                                </Text>
                              </Flex>
                            </Box>
                          </Flex>

                          {device.isInteractive ? (
                            <Box py={3} display="flex" justifyContent="center" alignItems="center">
                              <Flex align="center">
                                <Text
                                  fontSize="md"
                                  mr={3}
                                  fontWeight="500"
                                  color={(device as ActuatorDevice).isOn ? "green.500" : "gray.500"}
                                >
                                  {(device as ActuatorDevice).isOn ? "ON" : "OFF"}
                                </Text>
                                <Box
                                  onClick={() => toggleDevice(device.id)}
                                  w="50px"
                                  h="26px"
                                  bg={
                                    (device as ActuatorDevice).isOn
                                      ? secondaryGreen
                                      : "gray.300"
                                  }
                                  borderRadius="full"
                                  position="relative"
                                  transition="all 0.2s"
                                  cursor="pointer"
                                  boxShadow="md"
                                >
                                  <Box
                                    position="absolute"
                                    w="22px"
                                    h="22px"
                                    bg="white"
                                    borderRadius="full"
                                    transition="all 0.2s"
                                    transform={
                                      (device as ActuatorDevice).isOn
                                        ? "translateX(24px)"
                                        : "translateX(4px)"
                                    }
                                    top="2px"
                                    boxShadow="0 1px 3px rgba(0,0,0,0.3)"
                                  />
                                </Box>
                              </Flex>
                            </Box>
                          ) : (
                            <Box textAlign="center" py={3}>
                              <Text
                                fontSize="3xl"
                                fontWeight="bold"
                                color="gray.700"
                              >
                                {(device as SensorDevice).value}
                                {(device as SensorDevice).unit && (
                                  <Text
                                    as="span"
                                    fontSize="xl"
                                    fontWeight="normal"
                                    color="gray.500"
                                    ml={1}
                                  >
                                    {(device as SensorDevice).unit}
                                  </Text>
                                )}
                              </Text>
                            </Box>
                          )}

                          <Flex justify="space-between" align="center" mt="auto">
                            <Text fontSize="xs" color="gray.500">
                              Last updated: {getLastUpdateTime(device.id)}
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    );
                  })}
            </SimpleGrid>

            {/* Activity Log Section */}
            <Box
              mt={10}
              borderWidth="1px"
              borderRadius="lg"
              p={6}
              bg="white"
              boxShadow="sm"
              maxW="1200px"
              mx="auto"
            >
              <Flex 
                align="center" 
                justify="space-between"
                mb={4}
              >
                <Flex align="center">
                  <Box
                    px={2}
                    py={1}
                    borderRadius="md"
                    bg="blue.50"
                    color="blue.600"
                    mr={2}
                  >
                    <Icon boxSize="10px">
                      <FaSearch />
                    </Icon>
                  </Box>
                  <Heading size="md" color="gray.700">
                    Activity Log
                  </Heading>
                </Flex>
                
                <Text fontSize="sm" color="gray.500">
                  Auto-refreshing every 5 seconds
                </Text>
              </Flex>

              <DeviceLogs 
                showTitle={false} 
                compact={true} 
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Devices;
