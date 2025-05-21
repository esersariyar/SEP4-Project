import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { PredictionData, Ranges, Range } from '../types'; // Import from types.ts
import UpcomingReadingCard from './UpcomingReadingCard'; // Import the new component


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
        <UpcomingReadingCard
          title="Temperature"
          icon="🌡️"
          value={currentReading.predicted_temp}
          unit="°C"
          status={
            currentReading.predicted_temp < ranges.temp.ideal.min ? 'Too Cold' :
            currentReading.predicted_temp > ranges.temp.ideal.max ? 'Too Hot' : 'Optimal'
          }
          idealRangeMin={ranges.temp.ideal.min}
          idealRangeMax={ranges.temp.ideal.max}
          getReadingColor={getReadingColor}
          colorType="temp"
          iconBgColor="red.100"
          iconColor="red.500"
        />

        <UpcomingReadingCard
          title="Air Humidity"
          icon="💧"
          value={currentReading.predicted_air_humidity}
          unit="%"
          status={
            currentReading.predicted_air_humidity < ranges.air_humidity.ideal.min ? 'Too Dry' :
            currentReading.predicted_air_humidity > ranges.air_humidity.ideal.max ? 'Too Humid' : 'Optimal'
          }
          idealRangeMin={ranges.air_humidity.ideal.min}
          idealRangeMax={ranges.air_humidity.ideal.max}
          getReadingColor={getReadingColor}
          colorType="air_humidity"
          iconBgColor="blue.100"
          iconColor="blue.500"
        />

        <UpcomingReadingCard
          title="Soil Humidity"
          icon="🌱"
          value={currentReading.predicted_soil_humidity}
          unit="%"
          status={
            currentReading.predicted_soil_humidity < ranges.soil_humidity.ideal.min ? 'Too Dry' :
            currentReading.predicted_soil_humidity > ranges.soil_humidity.ideal.max ? 'Too Wet' : 'Optimal'
          }
          idealRangeMin={ranges.soil_humidity.ideal.min}
          idealRangeMax={ranges.soil_humidity.ideal.max}
          getReadingColor={getReadingColor}
          colorType="soil_humidity"
          iconBgColor="green.100"
          iconColor="green.500"
        />
      </SimpleGrid>

      {/* Second row - 2 items (centered) */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} bg="white" maxW={{ md: "66.67%" }} mx="auto" p={4} pb={6}>
        <UpcomingReadingCard
          title="CO2 Level"
          icon="☁️"
          value={currentReading.predicted_co2_level}
          unit="ppm"
          status={
            currentReading.predicted_co2_level < ranges.co2_level.ideal.min ? 'Too Low' :
            currentReading.predicted_co2_level > ranges.co2_level.ideal.max ? 'Too High' : 'Optimal'
          }
          idealRangeMin={ranges.co2_level.ideal.min}
          idealRangeMax={ranges.co2_level.ideal.max}
          getReadingColor={getReadingColor}
          colorType="co2_level"
          iconBgColor="purple.100"
          iconColor="purple.500"
        />

        <UpcomingReadingCard
          title="Light"
          icon="☀️"
          value={currentReading.predicted_light_lux}
          unit="lux"
          status={
            currentReading.predicted_light_lux < ranges.light_lux.ideal.min ? 'Too Dim' :
            currentReading.predicted_light_lux > ranges.light_lux.ideal.max ? 'Too Bright' : 'Optimal'
          }
          idealRangeMin={ranges.light_lux.ideal.min}
          idealRangeMax={ranges.light_lux.ideal.max}
          getReadingColor={getReadingColor}
          colorType="light_lux"
          iconBgColor="yellow.100"
          iconColor="yellow.500"
        />
      </SimpleGrid>
    </Box>
  );
};

export default UpcomingReadingsGrid; 