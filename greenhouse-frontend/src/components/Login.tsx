import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  Alert,
  AlertDescription,
  Image,
} from '@chakra-ui/react';
import Header from './Header';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const API_URL = 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {

        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || `Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        onLogin(data.token, data.user);

        navigate('/dashboard');
      } else {

        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        if (!inviteCode) {
          throw new Error('Invitation code is required');
        }

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            firstName: firstName || null,
            lastName: lastName || null,
            inviteCode: inviteCode || null
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || `Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        onLogin(data.token, data.user);

        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Authentication error:', err);

      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(`Could not connect to server. API URL: ${API_URL} - Please make sure the backend is running.`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient="linear(to-br, #e8f5e9, #f0f9f0 60%, #c8e6c9)"
      position="relative"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      overflowY="auto"
    >
      
      {/* Main content with login form */}
      <Flex
        flex="1"
        width="100%"
        alignItems="center"
        justifyContent="center"
        py={[2, 3, 4, 5]}
        mt={0}
      >
      <Container
        maxW={['95vw', '90vw', '400px', '480px']}
        bg={'white'}
        boxShadow={['md', 'lg', '2xl', '2xl']}
        p={[3, 4, 6, 8]}
        borderRadius={['xl', '2xl', '2xl', '3xl']}
        position="relative"
        zIndex={20}
        mx="auto"
        my={[2, 3, 4, 5]}
      >
        {/* Greenhouse Logo */}
        <Flex justifyContent="center" mb={[2, 2, 3, 4]}>
          <Box width={["56px", "72px", "110px", "140px"]} height={["56px", "72px", "110px", "140px"]}>
            <Image 
              src="https://i.ibb.co/F4NQcPfH/image.png" 
              alt="Via Greenhouse Logo"
              width="100%"
              height="100%"
              objectFit="contain"
              draggable={false}
              userSelect="none"
            />
          </Box>
        </Flex>
        <Heading
          textAlign={'center'}
          mb={[2, 2, 3, 4]}
          color={'green.700'}
          fontSize={["md", "lg", "2xl", "3xl"]}
          fontWeight="extrabold"
          letterSpacing="tight"
        >
          {isLogin ? 'Welcome to Via GreenHouse' : 'Join Via GreenHouse'}
        </Heading>

        {error && (
          <Box
            bg="red.50"
            color="red.700"
            borderRadius="md"
            mb={[2, 3, 4, 6]}
            fontSize={["sm", "md", "md", "lg"]}
            px={4}
            py={3}
            borderLeft="4px solid"
            borderColor="red.400"
            fontWeight="medium"
          >
            {error}
          </Box>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack gap={[2, 3, 4, 6]} alignItems={'stretch'} width="100%">
            <Box mb={[1, 1, 2, 2]}>
              <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>Username *</Text>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                size={["md", "md", "lg", "lg"]}
                borderColor="gray.300"
                _hover={{ borderColor: 'green.300' }}
                _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                width="100%"
                borderRadius="lg"
              />
            </Box>

            {isLogin && (
              <Box mb={[1, 1, 2, 2]}>
                <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>Password *</Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size={["md", "md", "lg", "lg"]}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'green.300' }}
                  _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                  width="100%"
                  borderRadius="lg"
                />
              </Box>
            )}

            {!isLogin && (
              <>
                <Flex direction={["column", "row"]} gap={[2, 2, 3, 4]} mb={[1, 1, 2, 2]}>
                  <Box flex={1} mb={[1, 0]}>
                    <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>Password *</Text>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      size={["md", "md", "lg", "lg"]}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'green.300' }}
                      _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                      width="100%"
                      borderRadius="lg"
                    />
                  </Box>

                  <Box flex={1}>
                    <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>Confirm Password *</Text>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      size={["md", "md", "lg", "lg"]}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'green.300' }}
                      _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                      width="100%"
                      borderRadius="lg"
                    />
                  </Box>
                </Flex>

                <Flex direction={["column", "row"]} gap={[2, 2, 3, 4]} mb={[1, 1, 2, 2]}>
                  <Box flex={1} mb={[1, 0]}>
                    <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>First Name <span style={{ color: '#aaa', fontWeight: 400 }}>(Optional)</span></Text>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      size={["md", "md", "lg", "lg"]}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'green.300' }}
                      _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                      width="100%"
                      borderRadius="lg"
                    />
                  </Box>

                  <Box flex={1}>
                    <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>Last Name <span style={{ color: '#aaa', fontWeight: 400 }}>(Optional)</span></Text>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      size={["md", "md", "lg", "lg"]}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'green.300' }}
                      _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                      width="100%"
                      borderRadius="lg"
                    />
                  </Box>
                </Flex>

                <Box mb={[1, 1, 2, 2]}>
                  <Text mb={[0.5, 1, 1, 1.5]} fontSize={["sm", "md", "md", "lg"]} fontWeight={'semibold'}>Invitation Code *</Text>
                  <Input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    size={["md", "md", "lg", "lg"]}
                    borderColor="gray.300"
                    _hover={{ borderColor: 'green.300' }}
                    _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 2px #68D391' }}
                    width="100%"
                    borderRadius="lg"
                  />
                </Box>
              </>
            )}

            <Button
              type="submit"
              colorScheme="green"
              size={["md", "md", "lg", "lg"]}
              fontSize={["md", "md", "lg", "xl"]}
              disabled={loading}
              width="100%"
              mt={[2, 2, 3, 4]}
              mb={[1, 1, 2, 2]}
              boxShadow="md"
              borderRadius="xl"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg', bg: 'green.400' }}
              transition="all 0.2s"
            >
              {loading ? 
                (isLogin ? 'Logging in...' : 'Creating account...') : 
                (isLogin ? 'Login' : 'Create Account')}
            </Button>
          </VStack>
        </form>

        <Flex mt={[2, 2, 3, 4]} justifyContent="center" alignItems="center">
          <Text fontSize={["sm", "md", "md", "lg"]}>
            {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
          </Text>
          <Button
            variant="ghost"
            colorScheme="green"
            onClick={toggleMode}
            size={["sm", "md", "md", "lg"]}
            ml={2}
            fontWeight="bold"
            height="auto"
            py={[0.5, 1, 1, 1.5]}
            _hover={{ bg: 'green.50', color: 'green.600' }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Button>
        </Flex>
      </Container>
      </Flex>
      
      {/* Bottom section with grass and plants - Simplified for mobile */}
      <Box
        width="100%"
        position="relative"
        height={["40px", "50px", "70px", "90px"]}
      >
        {/* Simplified grass at the bottom */}
        <Box
          position="fixed"
          bottom="0"
          left="0"
          width="100%"
          height={["40px", "50px", "70px", "90px"]}
          zIndex={12}
          backgroundImage={`url('https://freepngimg.com/download/grass/26-grass-png-image-green-picture.png')`}
          backgroundRepeat="repeat-x"
          backgroundSize={["auto 40px", "auto 60px", "auto 90px", "auto 120px"]}
          backgroundPosition="bottom center"
          display={["block"]}
        />

        {/* Only show decorative elements on larger screens */}
        <Box display={["none", "none", "block", "block"]}>
          {/* Tree on left - behind grass */}
          <Box
            position="fixed"
            bottom="10px"
            left="2%"
            width={['220px', '320px', '500px', '500px']}
            height={['180px', '250px', '400px', '400px']}
            zIndex={9}
          >
            <Image
              src="https://i.ibb.co/kg31X8Kq/image.png"
              alt="Tree"
              objectFit="contain"
              width="100%"
              height="100%"
              draggable={false}
              userSelect="none"
            />
          </Box>
          
          {/* Orange flower on right - above grass */}
          <Box
            position="fixed"
            bottom="20px"
            right={'10%'}
            width={['60px', '80px', '100px', '100px']}
            height={['60px', '80px', '100px', '100px']}
            zIndex={13}
          >
            <Image
              src="https://static.vecteezy.com/system/resources/previews/022/541/396/non_2x/floral-illustration-design-in-orange-color-free-png.png"
              alt="Orange Flower"
              objectFit="contain"
              width="100%"
              height="100%"
              draggable={false}
              userSelect="none"
            />
          </Box>
          
          {/* Flower pot in middle */}
          <Box
            position="fixed"
            bottom="0px"
            left={'40%'}
            width={['60px', '80px', '100px', '100px']}
            height={['60px', '80px', '100px', '100px']}
            zIndex={13}
          >
            <Image
              src="https://static.vecteezy.com/system/resources/previews/009/384/082/non_2x/flower-in-pot-clipart-design-illustration-free-png.png"
              alt="Flower in Pot"
              objectFit="contain"
              width="100%"
              height="100%"
              draggable={false}
              userSelect="none"
            />
          </Box>
          
          {/* Flower image */}
          <Box
            position="fixed"
            bottom="30px"
            left="75%"
            width={['60px', '80px', '100px', '100px']}
            height={['60px', '80px', '100px', '100px']}
            zIndex={13}
          >
            <Image
              src="https://pngcore.com/files/preview/800x800/11696259736vlogkdkpb1qxokuso8bkvzwexrpzuonmqcfcz49u9rvp4p0ktmjmkklh2gsboyrhfg2li5rzzosux3j8za4uyahrh0mwg6cok2fk.png"
              alt="Flower"
              objectFit="contain"
              width="100%"
              height="100%"
              draggable={false}
              userSelect="none"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;