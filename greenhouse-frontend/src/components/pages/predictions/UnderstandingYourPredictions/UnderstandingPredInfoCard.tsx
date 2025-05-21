import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

interface UnderstandingPredInfoCardProps {
  icon: string;
  title: string;
  text: string;
  themeColor: string;
}

const UnderstandingPredInfoCard: React.FC<UnderstandingPredInfoCardProps> = ({ icon, title, text, themeColor }) => {
  return (
    <Box
      p={5}
      bg={`${themeColor}.50`}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={`${themeColor}.100`}
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
          bg={`${themeColor}.100`}
          color={`${themeColor}.600`}
          p={2.5}
          borderRadius="lg"
          mb={3}
        >
          <Box as="span" fontSize="xl">{icon}</Box>
        </Box>
        <Heading as="h4" size="sm" color={`${themeColor}.700`}>
          {title}
        </Heading>
      </Flex>
      <Text color="gray.700" fontSize="sm" lineHeight="tall">
        {text}
      </Text>
    </Box>
  );
};

export default UnderstandingPredInfoCard; 