import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SensorCard from './SensorCard';

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
    render(<SensorCard {...defaultProps} />);
    
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('25°C')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<SensorCard {...defaultProps} loading={true} />);
    
    // Check if loading skeleton is rendered
    const skeleton = document.querySelector('.chakra-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('displays correct status color for different values', () => {
    const { rerender } = render(<SensorCard {...defaultProps} value={20} />);
    let badge = screen.getByText('20°C').closest('.chakra-badge');
    expect(badge).toHaveStyle({ color: 'green' });

    // Test warning threshold
    rerender(<SensorCard {...defaultProps} value={26} />);
    badge = screen.getByText('26°C').closest('.chakra-badge');
    expect(badge).toHaveStyle({ color: 'orange' });

    // Test danger threshold
    rerender(<SensorCard {...defaultProps} value={29} />);
    badge = screen.getByText('29°C').closest('.chakra-badge');
    expect(badge).toHaveStyle({ color: 'red' });

    // Test below ideal range
    rerender(<SensorCard {...defaultProps} value={15} />);
    badge = screen.getByText('15°C').closest('.chakra-badge');
    expect(badge).toHaveStyle({ color: 'blue' });
  });

  it('handles secondary value correctly', () => {
    render(
      <SensorCard
        {...defaultProps}
        secondaryValue={45}
        secondaryUnit="%"
      />
    );
    
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('handles string values correctly', () => {
    render(
      <SensorCard
        {...defaultProps}
        value="25.5"
        secondaryValue="45.2"
      />
    );
    
    expect(screen.getByText('25.5°C')).toBeInTheDocument();
    expect(screen.getByText('45.2%')).toBeInTheDocument();
  });

  it('applies correct grid column styles', () => {
    const gridColumn = { base: '1', sm: '2', md: '3' };
    render(<SensorCard {...defaultProps} gridColumn={gridColumn} />);
    
    const card = screen.getByText('Temperature').closest('.chakra-box');
    expect(card).toHaveStyle({
      gridColumn: '1 / span 1'
    });
  });

  it('renders with icon', () => {
    render(<SensorCard {...defaultProps} />);
    
    const iconContainer = document.querySelector('.chakra-icon');
    expect(iconContainer).toBeInTheDocument();
  });
}); 