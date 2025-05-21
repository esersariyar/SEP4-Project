import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';
import UnderstandingPredInfoCard from './UnderstandingPredInfoCard';

const UnderstandingPredictions: React.FC = () => {
  return (
    <Box
      bg="white"
      p={0}
      borderRadius="xl"
      boxShadow="lg"
      overflow="hidden"
      mt={8} // Added margin top for spacing, adjust as needed
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
          <UnderstandingPredInfoCard
            icon="🔄"
            title="Data Refresh System"
            text="Predictions refresh automatically every 30 seconds. For immediate updates, use the &quot;Generate New Predictions&quot; button to create fresh predictions from the current time."
            themeColor="blue"
          />
          <UnderstandingPredInfoCard
            icon="🌱"
            title="Actionable Insights"
            text="Our prediction model helps you anticipate environmental changes so you can take proactive measures for optimal plant health and growth."
            themeColor="green"
          />
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
  );
};

export default UnderstandingPredictions; 