import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Image,
} from '@chakra-ui/react';

interface HeaderProps {
  isLoggedIn: boolean;
  username: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, username, onLogout }) => {
  const location = useLocation();
  
  return (
    <Box
      as="header"
      bg="white"
      py={3}
      px={5}
      boxShadow="sm"
      borderBottom="1px"
      borderColor="gray.200"
    >
      <Flex
        as="nav"
        justify="space-between"
        align="center"
        maxW="container.xl"
        mx="auto"
      >
        <Flex alignItems="center">
          <Box width="40px" height="40px" mr={2}>
            <Image 
              src="https://i.ibb.co/v67KWPDs/1image.png" 
              alt="Via GreenHouse Logo"
              width="100%"
              height="100%"
              objectFit="contain"
            />
          </Box>
          <Box fontSize="xl" fontWeight="bold">
            <Link 
              to="/"
              style={{
                textDecoration: 'none',
                color: '#2e7d32',
              }}
            >
              Via GreenHouse
            </Link>
          </Box>
        </Flex>
        
        <HStack gap={6} alignItems="center">
          <Box>
            <Link 
              to="/"
              style={{
                textDecoration: 'none',
                color: location.pathname === '/' ? '#22c35e' : '#4a5568',
                fontWeight: location.pathname === '/' ? 'bold' : 'normal'
              }}
            >
              Home
            </Link>
          </Box>
          
          {isLoggedIn ? (
            <>
              <Box>
                <Link 
                  to="/dashboard"
                  style={{
                    textDecoration: 'none',
                    color: location.pathname === '/dashboard' ? '#22c35e' : '#4a5568',
                    fontWeight: location.pathname === '/dashboard' ? 'bold' : 'normal'
                  }}
                >
                  Dashboard
                </Link>
              </Box>
              <Box>
                <Link 
                  to="/settings"
                  style={{
                    textDecoration: 'none',
                    color: location.pathname === '/settings' ? '#22c35e' : '#4a5568',
                    fontWeight: location.pathname === '/settings' ? 'bold' : 'normal'
                  }}
                >
                  Settings
                </Link>
              </Box>
              <Box borderLeft="1px" borderColor="gray.200" height="20px" mx={2} />
              <HStack gap={4}>
                <Text fontSize="sm" color="gray.600">
                  Welcome, <Text as="span" fontWeight="bold">{username}</Text>
                </Text>
                
                <Button
                  onClick={onLogout}
                  size="sm"
                  colorScheme="red"
                  variant="solid"
                >
                  Logout
                </Button>
              </HStack>
            </>
          ) : (
            <Box>
              <Link 
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: location.pathname === '/login' ? '#22c35e' : '#4a5568',
                  fontWeight: location.pathname === '/login' ? 'bold' : 'normal'
                }}
              >
                Login
              </Link>
            </Box>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;