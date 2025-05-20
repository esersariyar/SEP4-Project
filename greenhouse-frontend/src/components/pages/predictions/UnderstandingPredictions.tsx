import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';

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
          <Box
            p={5}
            bg="blue.50"
            borderRadius="lg"
            boxShadow="sm"
            border="1px solid"
            borderColor="blue.100"
            transition="transform 0.2s"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
          >
            <Flex
              align="center"
              mb={4}
              justify="center"
              flexDir="column"
              textAlign="center"
            >
              <Box
                bg="blue.100"
                color="blue.600"
                p={2.5}
                borderRadius="lg"
                mb={3}
              >
                <Box as="span" fontSize="xl">🔄</Box>
              </Box>
              <Heading as="h4" size="sm" color="blue.700">
                Data Refresh System
              </Heading>
            </Flex>
            <Text color="gray.700" fontSize="sm" lineHeight="tall">
              Predictions refresh automatically every 30 seconds. For immediate updates,
              use the "Generate New Predictions" button to create fresh predictions from the current time.
            </Text>
          </Box>

          <Box
            p={5}
            bg="green.50"
            borderRadius="lg"
            boxShadow="sm"
            border="1px solid"
            borderColor="green.100"
            transition="transform 0.2s"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
          >
            <Flex
              align="center"
              mb={4}
              justify="center"
              flexDir="column"
              textAlign="center"
            >
              <Box
                bg="green.100"
                color="green.600"
                p={2.5}
                borderRadius="lg"
                mb={3}
              >
                <Box as="span" fontSize="xl">🌱</Box>
              </Box>
              <Heading as="h4" size="sm" color="green.700">
                Actionable Insights
              </Heading>
            </Flex>
            <Text color="gray.700" fontSize="sm" lineHeight="tall">
              Our prediction model helps you anticipate environmental changes so you can take proactive
              measures for optimal plant health and growth.
            </Text>
          </Box>
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