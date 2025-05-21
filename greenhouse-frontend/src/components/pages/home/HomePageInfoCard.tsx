import React from 'react';
import { Box, Flex, Heading, Text, Icon, GridItem } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface HomePageInfoCardProps {
  icon: IconType;
  title: string;
  desc: string;
  bg: string;
}

const HomePageInfoCard: React.FC<HomePageInfoCardProps> = ({ icon, title, desc, bg }) => {
  return (
    <GridItem>
      <Flex
        direction="column"
        align="center"
        bg="white"
        p={{ base: 6, md: 8 }}
        borderRadius="lg"
        boxShadow="md"
        transition="transform 0.25s, box-shadow 0.25s"
        height="100%"
        _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      >
        <Box bg={bg} p={4} borderRadius="full" mb={5} boxShadow="sm">
          <Icon as={icon} boxSize={{ base: 7, md: 8 }} color="gray.700" />
        </Box>
        <Heading as="h3" fontSize={{ base: 'lg', md: 'xl' }} color="green.600" mb={3}>
          {title}
        </Heading>
        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" textAlign="center">
          {desc}
        </Text>
      </Flex>
    </GridItem>
  );
};

export default HomePageInfoCard; 