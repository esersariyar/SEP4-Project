import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { PredictionData, Ranges, Range } from './types'; // Import from types.ts

// Define interfaces based on usage in Predictions.tsx
// interface PredictionData { // REMOVED
// ... (rest of PredictionData definition) ...
// }

// interface Range { // REMOVED
// ... (rest of Range definition) ...
// }

// interface Ranges { // REMOVED
// ... (rest of Ranges definition) ...
// }

interface UpcomingReadingsGridProps {
  currentReading: PredictionData | null;
  ranges: Ranges;
  getReadingColor: (type: string, value: number) => string;
}

const UpcomingReadingsGrid: React.FC<UpcomingReadingsGridProps> = ({ currentReading, ranges, getReadingColor }) => {
  if (!currentReading) {
    return null;
  }

  return (
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
            Next Update
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
  );
};

export default UpcomingReadingsGrid; 