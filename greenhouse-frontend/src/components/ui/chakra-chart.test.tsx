import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraLineChart } from './chakra-chart';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider value={defaultSystem}>
      {component}
    </ChakraProvider>
  );
};

describe('ChakraLineChart Component', () => {
  const mockData = [
    { timestamp: '2024-01-01T00:00:00Z', value: 25 },
    { timestamp: '2024-01-01T01:00:00Z', value: 26 },
    { timestamp: '2024-01-01T02:00:00Z', value: 24 },
  ];

  const defaultProps = {
    data: mockData,
    xAxisKey: 'timestamp',
    yAxisKeys: [
      { key: 'value', color: 'blue.500', name: 'Temperature' }
    ],
    title: 'Test Chart',
    height: 400
  };

  it('renders chart with basic props', () => {
    renderWithChakra(<ChakraLineChart {...defaultProps} />);

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    renderWithChakra(<ChakraLineChart {...defaultProps} data={[]} />);

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('No Data Found')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    renderWithChakra(<ChakraLineChart {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    const spinner = document.querySelector('.chakra-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('filters invalid data correctly', () => {
    const invalidData = [
      { timestamp: 'invalid-date', value: 25 },
      { timestamp: '2024-03-20T11:00:00', value: 26 },
      { timestamp: '2024-03-20T12:00:00', value: 27 }
    ];

    renderWithChakra(
      <ChakraLineChart
        {...defaultProps}
        data={invalidData}
      />
    );

    // Should only render valid data points
    const chartLines = document.querySelectorAll('.recharts-line');
    expect(chartLines.length).toBe(1); // One line for the value
  });

  it('applies custom x-axis formatting', () => {
    const formatXAxis = (value: string) => {
      const date = new Date(value);
      return date.toLocaleTimeString();
    };

    renderWithChakra(
      <ChakraLineChart
        {...defaultProps}
        formatXAxis={formatXAxis}
      />
    );

    // Check if the chart container is rendered
    const chartContainer = document.querySelector('.recharts-wrapper');
    expect(chartContainer).toBeInTheDocument();
  });

  it('renders reference lines when provided', () => {
    const referencePoints = [
      { y: 26, label: 'Warning', color: 'orange' },
      { y: 28, label: 'Danger', color: 'red' }
    ];

    renderWithChakra(
      <ChakraLineChart
        {...defaultProps}
        referencePoints={referencePoints}
      />
    );

    // Check if reference lines are rendered
    const referenceLines = document.querySelectorAll('.recharts-reference-line');
    expect(referenceLines.length).toBe(referencePoints.length);
  });

  it('applies correct height prop', async () => {
    renderWithChakra(<ChakraLineChart {...defaultProps} height={500} />);
    
    // Wait for chart container
    const chartContainer = await screen.findByTestId('chart-container');
    expect(chartContainer).toHaveStyle({ height: '550px' }); // height + 50px padding
  });

  it('renders legend correctly', () => {
    renderWithChakra(<ChakraLineChart {...defaultProps} />);
    
    const legend = document.querySelector('.recharts-legend');
    expect(legend).toBeInTheDocument();
    
    // Check if all yAxisKeys are in the legend
    defaultProps.yAxisKeys.forEach(key => {
      expect(screen.getByText(key.name)).toBeInTheDocument();
    });
  });
}); 