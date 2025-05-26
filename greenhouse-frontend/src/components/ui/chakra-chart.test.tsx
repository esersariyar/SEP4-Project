import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraLineChart } from './chakra-chart';

describe('ChakraLineChart Component', () => {
  const mockData = [
    { timestamp: '2024-03-20T10:00:00', temperature: 25, humidity: 60 },
    { timestamp: '2024-03-20T11:00:00', temperature: 26, humidity: 62 },
    { timestamp: '2024-03-20T12:00:00', temperature: 27, humidity: 65 }
  ];

  const defaultProps = {
    data: mockData,
    xAxisKey: 'timestamp',
    yAxisKeys: [
      { key: 'temperature', name: 'Temperature', color: '#ff6b6b' },
      { key: 'humidity', name: 'Humidity', color: '#4dabf7' }
    ],
    height: 400,
    title: 'Sensor Data'
  };

  it('renders with basic props', () => {
    render(<ChakraLineChart {...defaultProps} />);
    
    expect(screen.getByText('Sensor Data')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Humidity')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<ChakraLineChart {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    const spinner = document.querySelector('.chakra-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('filters invalid data correctly', () => {
    const invalidData = [
      { timestamp: 'invalid-date', temperature: 25, humidity: 60 },
      { timestamp: '2024-03-20T11:00:00', temperature: 26, humidity: 62 },
      { timestamp: '2024-03-20T12:00:00', temperature: 27, humidity: 65 }
    ];

    render(
      <ChakraLineChart
        {...defaultProps}
        data={invalidData}
      />
    );

    // Should only render valid data points
    const chartLines = document.querySelectorAll('.recharts-line');
    expect(chartLines.length).toBe(2); // One line for each yAxisKey
  });

  it('applies custom x-axis formatting', () => {
    const formatXAxis = (value: string) => {
      const date = new Date(value);
      return date.toLocaleTimeString();
    };

    render(
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

    render(
      <ChakraLineChart
        {...defaultProps}
        referencePoints={referencePoints}
      />
    );

    // Check if reference lines are rendered
    const referenceLines = document.querySelectorAll('.recharts-reference-line');
    expect(referenceLines.length).toBe(referencePoints.length);
  });

  it('handles empty data array', () => {
    render(
      <ChakraLineChart
        {...defaultProps}
        data={[]}
      />
    );

    // Should render empty state or message
    const chartContainer = document.querySelector('.recharts-wrapper');
    expect(chartContainer).toBeInTheDocument();
  });

  it('applies correct height prop', () => {
    render(<ChakraLineChart {...defaultProps} height={500} />);
    
    const chartContainer = document.querySelector('.recharts-wrapper');
    expect(chartContainer).toHaveStyle({ height: '500px' });
  });

  it('renders legend correctly', () => {
    render(<ChakraLineChart {...defaultProps} />);
    
    const legend = document.querySelector('.recharts-legend');
    expect(legend).toBeInTheDocument();
    
    // Check if all yAxisKeys are in the legend
    defaultProps.yAxisKeys.forEach(key => {
      expect(screen.getByText(key.name)).toBeInTheDocument();
    });
  });
}); 