import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SensorCard from './SensorCard';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider value={defaultSystem}>
      {component}
    </ChakraProvider>
  );
};

describe('SensorCard Component', () => {
  const defaultProps = {
    title: 'Temperature',
    value: 25,
    unit: '°C',
    icon: 'thermometer' as const,
    idealRange: {
      min: 18,
      max: 30
    },
    warningThreshold: 25,
    dangerThreshold: 28
  };

  it('renders with basic props', () => {
    renderWithChakra(<SensorCard {...defaultProps} />);
    
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    // Use a more flexible text matcher
    const valueElement = screen.getByText((content, element) => {
      return element?.textContent === '25.0°C' || element?.textContent === '25°C';
    });
    expect(valueElement).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    renderWithChakra(<SensorCard {...defaultProps} loading={true} />);
    
    // Use data-testid for loading state
    const loadingElement = screen.getByTestId('sensor-card-loading');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays correct status color for different values', () => {
    const { rerender } = renderWithChakra(<SensorCard {...defaultProps} value={20} />);
    
    // Use a more flexible text matcher for the value
    const valueElement = screen.getByText((content, element) => {
      return element?.textContent === '20.0°C' || element?.textContent === '20°C';
    });
    const badge = valueElement.closest('[data-testid="sensor-value-badge"]');
    expect(badge).toHaveStyle({ color: 'var(--chakra-colors-green-500)' });

    // Test warning threshold
    rerender(
      <ChakraProvider value={defaultSystem}>
        <SensorCard {...defaultProps} value={26} />
      </ChakraProvider>
    );
    const warningElement = screen.getByText((content, element) => {
      return element?.textContent === '26.0°C' || element?.textContent === '26°C';
    });
    const warningBadge = warningElement.closest('[data-testid="sensor-value-badge"]');
    expect(warningBadge).toHaveStyle({ color: 'var(--chakra-colors-orange-500)' });

    // Test danger threshold
    rerender(
      <ChakraProvider value={defaultSystem}>
        <SensorCard {...defaultProps} value={29} />
      </ChakraProvider>
    );
    const dangerElement = screen.getByText((content, element) => {
      return element?.textContent === '29.0°C' || element?.textContent === '29°C';
    });
    const dangerBadge = dangerElement.closest('[data-testid="sensor-value-badge"]');
    expect(dangerBadge).toHaveStyle({ color: 'var(--chakra-colors-red-500)' });

    // Test below ideal range
    rerender(
      <ChakraProvider value={defaultSystem}>
        <SensorCard {...defaultProps} value={15} />
      </ChakraProvider>
    );
    const belowElement = screen.getByText((content, element) => {
      return element?.textContent === '15.0°C' || element?.textContent === '15°C';
    });
    const belowBadge = belowElement.closest('[data-testid="sensor-value-badge"]');
    expect(belowBadge).toHaveStyle({ color: 'var(--chakra-colors-blue-500)' });
  });

  it('handles secondary value correctly', () => {
    renderWithChakra(
      <SensorCard
        {...defaultProps}
        secondaryValue={45}
        secondaryUnit="%"
      />
    );
    
    // Use a more flexible text matcher for secondary value
    const secondaryElement = screen.getByText((content, element) => {
      return element?.textContent === '45.0%' || element?.textContent === '45%';
    });
    expect(secondaryElement).toBeInTheDocument();
  });

  it('handles string values correctly', () => {
    renderWithChakra(
      <SensorCard
        {...defaultProps}
        value="25.5"
        secondaryValue="45.2"
        secondaryUnit="%"
      />
    );
    
    // Use a more flexible text matcher for both values
    const primaryElement = screen.getByText((content, element) => {
      return element?.textContent === '25.5°C';
    });
    const secondaryElement = screen.getByText((content, element) => {
      return element?.textContent === '45.2%';
    });
    
    expect(primaryElement).toBeInTheDocument();
    expect(secondaryElement).toBeInTheDocument();
  });

  it('applies correct grid column styles', () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <SensorCard
          {...defaultProps}
          gridColumn="1 / span 1"
        />
      </ChakraProvider>
    );

    const card = screen.getByTestId('sensor-card-container');
    const computedStyle = window.getComputedStyle(card);
    const normalizedGridColumn = computedStyle.gridColumn.replace(/\s+/g, '').trim();
    expect(normalizedGridColumn).toBe('1/span1');
  });

  it('renders with icon', () => {
    renderWithChakra(<SensorCard {...defaultProps} />);
    
    // Use data-testid for the icon
    const icon = screen.getByTestId('sensor-card-icon');
    expect(icon).toBeInTheDocument();
  });
}); 