import React from 'react';
import { Box, Flex, Text, Badge, Icon, Skeleton } from '@chakra-ui/react';
import { icons } from '../icons/SensorIcons';
import { ensureNumber } from '../../../utils';

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: keyof typeof icons;
  loading?: boolean;
  idealRange: {
    min: number;
    max: number;
  };
  warningThreshold?: number;
  dangerThreshold?: number;
  secondaryValue?: number | string;
  secondaryUnit?: string;
  gridColumn?: string | {
    base: string;
    sm: string;
    md: string;
  };
  iconColor?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  loading = false,
  idealRange,
  warningThreshold,
  dangerThreshold,
  secondaryValue,
  secondaryUnit,
  gridColumn,
  iconColor = 'blue.500'
}) => {
  const numericValue = ensureNumber(value);
  const numericSecondaryValue = secondaryValue !== undefined ? ensureNumber(secondaryValue) : undefined;

  const getStatusColor = (value: number) => {
    if (value < idealRange.min) return 'blue';
    if (dangerThreshold !== undefined && value >= dangerThreshold) return 'red';
    if (warningThreshold !== undefined && value >= warningThreshold) return 'orange';
    return 'green';
  };

  const IconComponent = icons[icon];

  if (loading) {
    return (
      <Box
        p={4}
        borderRadius="lg"
        bg="white"
        boxShadow="sm"
        data-testid="sensor-card-loading"
      >
        <Skeleton height="20px" mb={2} />
        <Skeleton height="40px" />
      </Box>
    );
  }

  return (
    <Box
      p={4}
      borderRadius="lg"
      bg="white"
      boxShadow="sm"
      gridColumn={gridColumn}
      data-testid="sensor-card-container"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" color="gray.600">
          {title}
        </Text>
        <Box data-testid="sensor-card-icon">
          <IconComponent boxSize={5} color={iconColor} />
        </Box>
      </Flex>

      <Badge
        fontSize="2xl"
        colorScheme={getStatusColor(numericValue)}
        px={3}
        py={1}
        borderRadius="md"
        data-testid="sensor-value-badge"
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit}
      </Badge>

      {secondaryValue !== undefined && (
        <Text mt={2} fontSize="sm" color="gray.600">
          {typeof secondaryValue === 'number' ? secondaryValue.toFixed(1) : secondaryValue}
          {secondaryUnit}
        </Text>
      )}
    </Box>
  );
};

export default SensorCard; 