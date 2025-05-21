import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  Text,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaSeedling, FaTemperatureHigh, FaWater } from 'react-icons/fa';
import HomePageInfoCard from './HomePageInfoCard';

const Home: React.FC = () => {
  const heroDir   = useBreakpointValue({ base: 'column', lg: 'row' });
  const imgOrder  = useBreakpointValue({ base: 1,       lg: 2 });
  const textOrder = useBreakpointValue({ base: 2,       lg: 1 });

  return (
    <Box
      bg="linear-gradient(45deg,#d7f5e3 0%,#eafff2 100%)"
      position="relative"
      minH="calc(100vh - 62px)"
      overflow="hidden"
      py={{ base: 6, md: 8 }}                    /* extra breathing room */
    >
      {/* decorative blobs */}
      <Box position="absolute" w="320px" h="320px" bg="green.50" opacity={0.35} borderRadius="full" top="-220px" left="-70px" pointerEvents="none" />
      <Box position="absolute" w="220px" h="220px" bg="teal.50"  opacity={0.45} borderRadius="full" bottom="-60px" right="-50px" pointerEvents="none" />

      <Container maxW="1280px" px={{ base: 5, md: 8 }}>
        <Flex
          direction="column"
          justify="center"
          gap={{ base: 12, md: 16 }}              /* larger section gap   */
        >

          {/* HERO */}
          <Flex
            direction={heroDir}
            align="center"
            justify="space-between"
            gap={{ base: 8, lg: 14 }}             /* wider column gap     */
            wrap="wrap"
          >
            <Box
              flex="1"
              maxW={{ base: '100%', lg: '560px' }} /* text column width cap */
              order={textOrder}
              textAlign={{ base: 'center', lg: 'left' }}
            >
              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
                fontWeight="extrabold"
                color="green.600"
                lineHeight={1.1}
                mb={6}
              >
                SMART <br /> GREENHOUSE
              </Heading>

              <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.700" mb={8} lineHeight={1.5}>
                Monitor and control your greenhouse environment in real-time with our smart monitoring system.
                Track conditions, analyze data and optimise plant growth – all from one intuitive dashboard.
              </Text>

              <RouterLink to="/dashboard">
                <Button
                  size={{ base: 'lg', md: 'xl' }}
                  bg="green.500"
                  color="white"
                  _hover={{ bg: 'green.600', transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  px={8}
                  py={6}
                  fontWeight="bold"
                  borderRadius="lg"
                  boxShadow="md"
                >
                  Go to Dashboard
                </Button>
              </RouterLink>
            </Box>

            <Box flex="1" order={imgOrder} display="flex" justifyContent="center">
              <Image
                src="https://png.pngtree.com/png-vector/20230729/ourmid/pngtree-greenhouse-clipart-drawing-of-large-greenhouse-illustration-free-stock-vector-cartoon-png-image_6814715.png"
                alt="Smart Greenhouse"
                maxH={{ base: '220px', sm: '260px', md: '300px', lg: '360px' }}
                w="auto"
                objectFit="contain"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src =
                    'https://img.freepik.com/free-vector/smart-greenhouse-concept-illustration_114360-8076.jpg';
                }}
              />
            </Box>
          </Flex>

          {/* FEATURE CARDS */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(auto-fit,minmax(260px,1fr))' }}
            gap={{ base: 6, md: 8 }}               /* bigger card spacing   */
          >
            {[
              { icon: FaTemperatureHigh, title: 'Key Metrics', desc: 'Monitor critical conditions: temperature, air humidity, CO2, and light intensity.', bg: 'green.50' },
              { icon: FaWater,            title: 'Live Data Stream',    desc: 'Access continuous sensor readings, updated every 10 seconds for real-time awareness.', bg: 'blue.50'  },
              { icon: FaSeedling,         title: 'Growth Optimization',      desc: 'Leverage data insights to enhance plant health and maximize growth potential.',     bg: 'teal.50'  },
            ].map((cardProps) => (
              <HomePageInfoCard
                key={cardProps.title}
                icon={cardProps.icon}
                title={cardProps.title}
                desc={cardProps.desc}
                bg={cardProps.bg}
              />
            ))}
          </Grid>
        </Flex>
      </Container>
    </Box>
  );
};

export default Home;
