import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { productALightTheme, productADarkTheme, generateCssVariables } from '@vami/design-tokens';
import { ThemeProvider, useTheme, Box, Text, Heading, Badge } from '../index';

function TestChild() {
  const { activeMode, toggleMode, mode } = useTheme();
  return (
    <div>
      <span data-testid="mode-display">{mode}</span>
      <span data-testid="active-mode-display">{activeMode}</span>
      <button data-testid="toggle-btn" onClick={toggleMode}>
        Toggle Mode
      </button>
    </div>
  );
}

describe('@vami/ui — Theme Engine & Atomic Layout Primitives', () => {
  it('generates valid CSS variable map from theme contract', () => {
    const { vars, cssString } = generateCssVariables(productALightTheme);
    expect(vars['--vami-color-background-primary']).toBe('#ffffff');
    expect(vars['--vami-color-brand-accent']).toBe('#2563eb');
    expect(cssString).toContain(':root');
  });

  it('renders ThemeProvider and handles theme mode toggle', () => {
    render(
      <ThemeProvider lightTheme={productALightTheme} darkTheme={productADarkTheme} defaultMode="light">
        <TestChild />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mode-display').textContent).toBe('light');
    expect(screen.getByTestId('active-mode-display').textContent).toBe('light');

    fireEvent.click(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('active-mode-display').textContent).toBe('dark');
  });

  it('renders Box layout primitive with custom background and token border', () => {
    const { container } = render(<Box padding="16px" background="#f8fafc">Box Content</Box>);
    expect(container.textContent).toBe('Box Content');
  });

  it('renders Text, Heading, and Badge components with correct semantic props', () => {
    render(
      <div>
        <Heading level={1}>Dashboard Title</Heading>
        <Text size="md">Welcome back</Text>
        <Badge variant="success">Active</Badge>
      </div>
    );

    expect(screen.getByText('Dashboard Title')).toBeDefined();
    expect(screen.getByText('Welcome back')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();
  });
});
