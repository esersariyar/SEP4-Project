import React from 'react';
import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { Ranges } from '../types';

interface UpcomingReadingCardProps {
  title: string;
  icon: string;
  value: number;
  unit: string;
  status: string;
  idealRangeMin: number;
  idealRangeMax: number;
  getReadingColor: (type: string, value: number) => string;
  colorType: string;
  iconBgColor: string;
  iconColor: string;
}

const UpcomingReadingCard: React.FC<UpcomingReadingCardProps> = ({
  title,
  icon,
  value,
  unit,
  status,
  idealRangeMin,
  idealRangeMax,
  getReadingColor,
  colorType,
  iconBgColor,
  iconColor,
}) => {
  return (
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
            bg={iconBgColor}
            color={iconColor}
            p={1}
            borderRadius="md"
          >
            {icon}
          </Box>
          <Text fontWeight="bold" fontSize="lg">{title}</Text>
        </Flex>

        <Box
          py={1}
          px={3}
          borderRadius="full"
          bg={getReadingColor(colorType, value) + '20'}
          color={getReadingColor(colorType, value)}
          fontWeight="bold"
          fontSize="sm"
        >
          {status}
        </Box>
      </Flex>

      <Flex align="baseline">
        <Text
          fontSize="4xl"
          fontWeight="bold"
          color={getReadingColor(colorType, value)}
          lineHeight="1"
        >
          {value}
        </Text>
        <Text
          fontSize="xl"
          color={getReadingColor(colorType, value)}
          ml={1}
        >
          {unit}
        </Text>
      </Flex>

      <Text fontSize="xs" color="gray.500" mt={2}>
        Ideal range: {idealRangeMin}-{idealRangeMax}{unit}
      </Text>
    </Box>
  );
};

export default UpcomingReadingCard; 
