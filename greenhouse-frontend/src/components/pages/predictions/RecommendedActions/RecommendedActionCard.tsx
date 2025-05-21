import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

interface RecommendedActionCardProps {
  icon: string;
  sensorName: string;
  message: string;
  type: 'warning' | 'info' | string; // Allow for other types if necessary
}

const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({
  icon,
  sensorName,
  message,
  type,
}) => {
  const cardBg = type === 'warning' ? 'yellow.50' : 'green.50';
  const borderColor = type === 'warning' ? 'yellow.200' : 'green.200';
  const textColor = type === 'warning' ? 'yellow.700' : 'green.700';
  const messageColor = type === 'warning' ? 'yellow.800' : 'green.800';

  return (
    <Box
      p={4}
      borderRadius="md"
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
    >
      <Flex mb={2} align="center">
        <Box fontSize="2xl" mr={2}>{icon}</Box>
        <Text fontWeight="bold" color={textColor}>
          {sensorName}
        </Text>
      </Flex>
      <Text color={messageColor}>
        {message}
      </Text>
    </Box>
  );
};

export default RecommendedActionCard; 