import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';
import { Insight } from '../types';
import RecommendedActionCard from './RecommendedActionCard';

interface RecommendedActionsProps {
  insights: Insight[];
}

const RecommendedActions: React.FC<RecommendedActionsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
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

      {insights.length <= 3 ? (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {insights.map((insight, index) => (
            <RecommendedActionCard
              key={index}
              icon={insight.icon}
              sensorName={
                insight.sensor === 'temperature' ? 'Temperature' :
                insight.sensor === 'air_humidity' ? 'Air Humidity' :
                insight.sensor === 'soil_humidity' ? 'Soil Humidity' :
                insight.sensor === 'co2_level' ? 'CO2 Level' : 'Light'
              }
              message={insight.message}
              type={insight.type}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Box>
          {/* First row - 3 items */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={5} mb={5}>
            {insights.slice(0, 3).map((insight, index) => (
              <RecommendedActionCard
                key={index}
                icon={insight.icon}
                sensorName={
                  insight.sensor === 'temperature' ? 'Temperature' :
                  insight.sensor === 'air_humidity' ? 'Air Humidity' :
                  insight.sensor === 'soil_humidity' ? 'Soil Humidity' :
                  insight.sensor === 'co2_level' ? 'CO2 Level' : 'Light'
                }
                message={insight.message}
                type={insight.type}
              />
            ))}
          </SimpleGrid>

          {/* Second row - remaining items (centered) */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={5} maxW={{ md: "66%" }} mx="auto">
            {insights.slice(3).map((insight, index) => (
              <RecommendedActionCard
                key={index + 3}
                icon={insight.icon}
                sensorName={
                  insight.sensor === 'temperature' ? 'Temperature' :
                  insight.sensor === 'air_humidity' ? 'Air Humidity' :
                  insight.sensor === 'soil_humidity' ? 'Soil Humidity' :
                  insight.sensor === 'co2_level' ? 'CO2 Level' : 'Light'
                }
                message={insight.message}
                type={insight.type}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
};

export default RecommendedActions; 