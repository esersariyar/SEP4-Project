import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  Box, Input, Button, Text, Flex, Spinner, IconButton,
  useBreakpointValue, Stack, Center
} from '@chakra-ui/react';
import { Tabs } from '@chakra-ui/react';
import { Alert } from '@chakra-ui/react';
import { ViewHorizontalIcon, ViewNoneIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';

// Custom hook for tracking window resize
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useLayoutEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
}

interface UserProfile {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  refCode: string;
}

// Password tips for carousel (all use lock icon)
const lockIcon = (
  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const shieldIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
  <path d="M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .101.025 1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56"/>
  <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415"/>
</svg>
);

const fileLockIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"  viewBox="0 0 16 16">
  <path d="M8 5a1 1 0 0 1 1 1v1H7V6a1 1 0 0 1 1-1m2 2.076V6a2 2 0 1 0-4 0v1.076c-.54.166-1 .597-1 1.224v2.4c0 .816.781 1.3 1.5 1.3h3c.719 0 1.5-.484 1.5-1.3V8.3c0-.627-.46-1.058-1-1.224"/>
  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1"/>
</svg>
);

const personLockIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
  <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 5.996V14H3s-1 0-1-1 1-4 6-4q.845.002 1.544.107a4.5 4.5 0 0 0-.803.918A11 11 0 0 0 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664zM9 13a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1"/>
</svg>
);


const passwordTips = [
  { 
    icon: lockIcon, 
    text: 'Use at least 6 characters. Longer passwords are significantly harder to crack. For best security, consider using 12+ characters for important accounts.' 
  },
  { 
    icon: shieldIcon, 
    text: 'Mix upper and lower case letters. Passwords with varied capitalization are more secure. Try to avoid predictable patterns like capitalizing only the first letter.' 
  },
  { 
    icon: fileLockIcon, 
    text: 'Include numbers and symbols. Adding special characters like @, #, !, $ significantly increases password strength. Substitute letters with numbers (e.g. "a" with "4") for better security.' 
  },
  { 
    icon: personLockIcon, 
    text: 'Avoid common words or names. Don\'t use your name, birth date, or dictionary words. Passwords like "password123" or "qwerty" are among the first guessed by attackers.' 
  },
  { 
    icon: lockIcon, 
    text: 'Use a unique password for each account. If one account is compromised, unique passwords prevent hackers from accessing your other accounts. Consider using a secure password manager.' 
  },
  { 
    icon: shieldIcon, 
    text: 'Change your password regularly. Update passwords every 3-6 months, especially for sensitive accounts. Don\'t reuse old passwords or make minor modifications to them.' 
  },
  {
    icon: fileLockIcon,
    text: 'Consider using a password phrase. A sentence or phrase with spaces is easier to remember and can be more secure than a complex short password.'
  },
  {
    icon: personLockIcon,
    text: 'Avoid using personal information. Don\'t include your address, phone number, children\'s names, or other personal details that someone might discover through social media.'
  }
];

// Custom styles to be added in a style tag
const alertStyles = `
  .password-tip-alert .chakra-alert__icon {
    margin-right: 16px;
    margin-top: 0;
    align-self: center;
  }
  .password-tip-alert .chakra-alert__desc {
    text-align: center;
    display: block;
    width: 100%;
  }
  .password-tip-alert .chakra-alert__title {
    text-align: center;
    display: block;
    width: 100%;
  }
`;

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ tab: string; type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');
  
  // Get window size for responsive layout
  const windowSize = useWindowSize();
  
  // Responsive settings using Chakra UI's useBreakpointValue
  const containerPadding = useBreakpointValue({ base: 4, sm: 6, md: 8, lg: 10 });
  // Use specific enum values to avoid type errors
  const fieldSpacing = useBreakpointValue({ base: 4, md: 6 });
  const tipsIconSize = useBreakpointValue({ base: 32, md: 40 });
  
  // Hard-coded values within component - this avoids type issues
  const getInputSize = () => windowSize.width < 768 ? "md" : "lg";
  const getHeaderSize = () => windowSize.width < 768 ? "xl" : "2xl";
  const getTipsFontSize = () => windowSize.width < 768 ? "lg" : "2xl";
  
  const API_URL = process.env.BACKEND_URL || 'http://localhost:3000';
  const navigate = useNavigate();
  
  // Token refresh function
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      if (data.success) {
        // Token is still valid, update user info
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          navigate('/login');
          return;
        }

        // Try to refresh token first
        const isTokenValid = await refreshToken();
        if (!isTokenValid) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('Session expired. Please login again.');
          setLoading(false);
          navigate('/login');
          return;
        }
        
        const response = await fetch(`${API_URL}/api/settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('Session expired. Please login again.');
          setLoading(false);
          navigate('/login');
          return;
        }
        
        if (!response.ok) {
          const errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.data);
          setFirstName(data.data.firstName || '');
          setLastName(data.data.lastName || '');
        } else {
          throw new Error(data.message || 'Failed to fetch profile data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [API_URL, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmation(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setConfirmation({ tab: activeTab, type: 'error', message: 'Not authenticated' });
        navigate('/login');
        return;
      }

      // Try to refresh token first
      const isTokenValid = await refreshToken();
      if (!isTokenValid) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setConfirmation({ tab: activeTab, type: 'error', message: 'Session expired. Please login again.' });
        navigate('/login');
        return;
      }

      const requestBody: any = {
        firstName,
        lastName
      };
      // Only include password fields if both are provided
      if (currentPassword && newPassword) {
        requestBody.currentPassword = currentPassword;
        requestBody.newPassword = newPassword;
      }
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorText = `HTTP error ${response.status}`;
        setConfirmation({ tab: activeTab, type: 'error', message: errorText });
        throw new Error(errorText);
      }
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setConfirmation({ tab: activeTab, type: 'success', message: 'Profile updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        
        // Update the local user data if it exists
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            userData.firstName = firstName;
            userData.lastName = lastName;
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (e) {
            // Non-blocking error
          }
        }
      } else {
        setConfirmation({ tab: activeTab, type: 'error', message: data.message || 'Failed to update profile' });
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setConfirmation({ tab: activeTab, type: 'error', message: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  };
  
  // Password tips carousel state
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % passwordTips.length);
    }, 8500);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return <Flex justify="center" align="center" minH="200px"><Spinner size="lg" /></Flex>;
  }
  
  if (error && !profile) {
    return (
      <Box maxW="900px" minH="70vh" mx="auto" mt={10} p={containerPadding} bg="white" borderRadius="2xl" boxShadow="2xl">
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      </Box>
    );
  }
  
  return (
    <Flex 
      justify="center" 
      align="flex-start" 
      minH="80vh" 
      bg="gray.50" 
      py={{ base: 6, md: 16 }}
      px={{ base: 2, sm: 4, md: 6 }}
    >
      <Box 
        w="100%" 
        maxW="900px" 
        minH="70vh" 
        mx="auto" 
        p={{ base: 4, sm: 6, md: 10 }} 
        bg="white" 
        borderRadius={{ base: "xl", md: "2xl" }} 
        boxShadow={{ base: "xl", md: "2xl" }}
      >
        <Flex align="center" justify="center" gap={2} mb={{ base: 6, md: 8 }}>
          <Text fontSize={getHeaderSize()} fontWeight="bold" color="green.600" letterSpacing={1}>Settings</Text>
        </Flex>
        <Tabs.Root defaultValue="profile" onValueChange={(details) => { setActiveTab(details.value); setConfirmation(null); }}>
          {confirmation && (
            <Alert.Root status={confirmation.type} mb={4}>
              <Alert.Indicator />
              <Alert.Title>{confirmation.type === 'success' ? 'Success' : 'Error'}</Alert.Title>
              <Alert.Description>{confirmation.message}</Alert.Description>
            </Alert.Root>
          )}
          {/* @ts-ignore */}
          <Tabs.List style={{ 
            borderBottom: '2px solid #eee', 
            marginBottom: 32, 
            gap: windowSize.width < 600 ? 16 : 32, 
            display: 'flex', 
            justifyContent: 'center',
            flexWrap: windowSize.width < 480 ? 'wrap' : 'nowrap',
            padding: windowSize.width < 480 ? '0 0 12px 0' : 0
          }}>
            {/* @ts-ignore */}
            <Tabs.Trigger value="profile" style={{ 
              color: '#4a5568', 
              fontWeight: 'medium',
              fontSize: windowSize.width < 600 ? '0.9rem' : '1rem'
            }}><>Profile Settings</></Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="password" style={{ 
              color: '#4a5568', 
              fontWeight: 'medium',
              fontSize: windowSize.width < 600 ? '0.9rem' : '1rem'
            }}><>Password Settings</></Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="device" style={{ 
              color: '#4a5568', 
              fontWeight: 'medium',
              fontSize: windowSize.width < 600 ? '0.9rem' : '1rem'
            }}><>Device Settings</></Tabs.Trigger>
          </Tabs.List>
          {/* @ts-ignore */}
          <Tabs.Content value="profile">
            <>
            <Box mb={fieldSpacing} p={{ base: 4, md: 6 }} bg="gray.50" borderRadius="lg" boxShadow="sm">
              <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}><b>Username:</b> {profile?.username}</Text>
              <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}><b>Referral Code:</b> {profile?.refCode}</Text>
            </Box>
            <form onSubmit={handleSubmit}>
              <Box mb={fieldSpacing}>
                <Text mb={1} fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>First Name</Text>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  size={getInputSize()}
                  bg="gray.100"
                  borderRadius="md"
                />
              </Box>
              <Box mb={fieldSpacing}>
                <Text mb={1} fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>Last Name</Text>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  size={getInputSize()}
                  bg="gray.100"
                  borderRadius="md"
                />
              </Box>
              <Button colorScheme="green" size={getInputSize()} type="submit" mt={2} w="full">Save Changes</Button>
            </form>
            </>
          </Tabs.Content>
          {/* @ts-ignore */}
          <Tabs.Content value="password">
            <Flex direction="column" align="center" justify="center" minH={{ base: "300px", md: "400px" }} w="100%">
              <Flex 
                p={4} 
                bg="blue.50" 
                color="blue.800" 
                borderRadius="md" 
                mb={6} 
                w="100%" 
                alignItems="center" 
                flexDirection={{ base: "column", sm: "row" }}
                boxShadow="sm"
              >
                <Flex 
                  justifyContent="center" 
                  alignItems="center" 
                  mr={{ base: 0, sm: 4 }} 
                  mb={{ base: 3, sm: 0 }}
                  color="blue.500"
                  minWidth={{ base: "auto", sm: "60px" }}
                >
                  {React.cloneElement(passwordTips[tipIndex].icon, { 
                    width: tipsIconSize, 
                    height: tipsIconSize,
                    style: { animation: 'tip-bounce 1.2s infinite alternate' }
                  })}
                </Flex>
                <Flex 
                  flexDirection="column" 
                  alignItems={{ base: "center", sm: "flex-start" }}
                  textAlign={{ base: "center", sm: "left" }}
                  flex="1"
                >
                  <Text 
                    fontWeight="bold" 
                    fontSize={getTipsFontSize()} 
                    mb={1}
                  >
                    Password Tip
                  </Text>
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    {passwordTips[tipIndex].text}
                  </Text>
                </Flex>
              </Flex>
              <style>{`
                @keyframes tip-bounce {
                  0% { transform: translateY(4px); }
                  100% { transform: translateY(-4px); }
                }
              `}</style>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Box mb={fieldSpacing}>
                  <Text mb={1} fontWeight="medium" color="gray.700" fontSize={{ base: "sm", md: "md" }}>Current Password</Text>
                  <Flex align="center" gap={2}>
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      size={getInputSize()}
                      bg="gray.50"
                      borderRadius="md"
                      borderColor="gray.200"
                      _hover={{ borderColor: 'gray.300' }}
                      _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
                    />
                    {/* @ts-ignore */}
                    <IconButton
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      variant="ghost"
                      size={getInputSize()}
                      colorScheme="green"
                      flexShrink={0}
                    >
                      {showCurrentPassword ? (
                        // Bootstrap eye (open)
                        <svg xmlns="http://www.w3.org/2000/svg" width={windowSize.width < 768 ? "20" : "24"} height={windowSize.width < 768 ? "20" : "24"} fill="currentColor" viewBox="0 0 16 16">
                          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                        </svg>
                      ) : (
                        // Bootstrap eye-slash (closed)
                        <svg xmlns="http://www.w3.org/2000/svg" width={windowSize.width < 768 ? "20" : "24"} height={windowSize.width < 768 ? "20" : "24"} fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                          <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                          <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                        </svg>
                      )}
                    </IconButton>
                  </Flex>
                </Box>
                <Box mb={fieldSpacing}>
                  <Text mb={1} fontWeight="medium" color="gray.700" fontSize={{ base: "sm", md: "md" }}>New Password</Text>
                  <Flex align="center" gap={2}>
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      size={getInputSize()}
                      bg="gray.50"
                      borderRadius="md"
                      borderColor="gray.200"
                      _hover={{ borderColor: 'gray.300' }}
                      _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
                    />
                    {/* @ts-ignore */}
                    <IconButton
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      variant="ghost"
                      size={getInputSize()}
                      colorScheme="green"
                      flexShrink={0}
                    >
                      {showNewPassword ? (
                        // Bootstrap eye (open)
                        <svg xmlns="http://www.w3.org/2000/svg" width={windowSize.width < 768 ? "20" : "24"} height={windowSize.width < 768 ? "20" : "24"} fill="currentColor" viewBox="0 0 16 16">
                          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                        </svg>
                      ) : (
                        // Bootstrap eye-slash (closed)
                        <svg xmlns="http://www.w3.org/2000/svg" width={windowSize.width < 768 ? "20" : "24"} height={windowSize.width < 768 ? "20" : "24"} fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                          <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                          <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                        </svg>
                      )}
                    </IconButton>
                  </Flex>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mt={2}>Password must be at least 6 characters long</Text>
                </Box>
                <Button colorScheme="green" size={getInputSize()} type="submit" w="full">Change Password</Button>
              </form>
            </Flex>
          </Tabs.Content>
          {/* @ts-ignore */}
          <Tabs.Content value="device">
            <><Box p={{ base: 4, md: 8 }} bg="gray.50" borderRadius="lg" textAlign="center"><Text color="gray.500" fontSize={{ base: "md", md: "lg" }}>Device settings are currently unavailable.</Text></Box></>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Flex>
  );
} 