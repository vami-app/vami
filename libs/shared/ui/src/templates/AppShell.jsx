import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * Enterprise Responsive AppShell layout template.
 * Houses Header with Light/Dark Mode Switcher, Responsive Sidebar, Main Content, and Footer.
 *
 * @param {{
 *   title?: string,
 *   navigation?: React.ReactNode,
 *   sidebar?: React.ReactNode,
 *   children?: React.ReactNode,
 *   userMenu?: React.ReactNode
 * }} props
 */
export function AppShell({ title = 'Vami Platform', navigation, sidebar, children, userMenu }) {
  const { activeMode, toggleMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return React.createElement(
    'div',
    {
      style: {
        minHeight: '100vh',
        background: 'var(--vami-color-background-primary, #ffffff)',
        color: 'var(--vami-color-text-primary, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--vami-typography-font-sans, sans-serif)',
        transition: 'background 0.25s ease, color 0.25s ease',
      },
    },
    // Header Navigation Bar
    React.createElement(
      'header',
      {
        style: {
          height: '64px',
          borderBottom: '1px solid var(--vami-color-border-subtle, #e2e8f0)',
          background: 'var(--vami-color-surface-card, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
        sidebar &&
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => setSidebarOpen((prev) => !prev),
              style: {
                background: 'transparent',
                border: 'none',
                color: 'var(--vami-color-text-primary)',
                cursor: 'pointer',
                fontSize: '18px',
              },
              'aria-label': 'Toggle Navigation Sidebar',
            },
            '☰'
          ),
        React.createElement(
          'span',
          {
            style: {
              fontWeight: '700',
              fontSize: '18px',
              color: 'var(--vami-color-brand-accent, #2563eb)',
              letterSpacing: '-0.02em',
            },
          },
          title
        )
      ),
      navigation && React.createElement('nav', { style: { display: 'flex', gap: '16px' } }, navigation),
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        // Light / Dark Mode Switcher Button
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: toggleMode,
            style: {
              background: 'var(--vami-color-background-subdued, #f1f5f9)',
              color: 'var(--vami-color-text-primary, #0f172a)',
              border: '1px solid var(--vami-color-border-subtle, #e2e8f0)',
              borderRadius: 'var(--vami-radius-md, 8px)',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            },
            'aria-label': 'Toggle Light/Dark Theme',
          },
          activeMode === 'dark' ? '☀️ Light' : '🌙 Dark'
        ),
        userMenu
      )
    ),
    // Main Body Container (Sidebar + Content)
    React.createElement(
      'div',
      { style: { display: 'flex', flex: 1 } },
      sidebar &&
        React.createElement(
          'aside',
          {
            style: {
              width: '240px',
              borderRight: '1px solid var(--vami-color-border-subtle, #e2e8f0)',
              background: 'var(--vami-color-background-secondary, #f8fafc)',
              padding: '24px 16px',
              display: sidebarOpen || typeof window === 'undefined' || window.innerWidth >= 768 ? 'block' : 'none',
            },
          },
          sidebar
        ),
      React.createElement(
        'main',
        {
          style: {
            flex: 1,
            padding: '32px 24px',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          },
        },
        children
      )
    )
  );
}
