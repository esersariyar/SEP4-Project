import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';
import { Insight } from './types';

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
            {insights.slice(0, 3).map((insight, index) => (
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
            {insights.slice(3).map((insight, index) => (
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
  );
};

export default RecommendedActions; 