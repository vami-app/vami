import React, { forwardRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * Enterprise Responsive AppShell layout template.
 * Houses Responsive Sidebar (Full Height), Header with Mode Switcher (Inside Main Column), and Main Content.
 *
 * @type {React.ForwardRefExoticComponent<{
 *   title?: string,
 *   navigation?: React.ReactNode,
 *   sidebar?: React.ReactNode,
 *   children?: React.ReactNode,
 *   userMenu?: React.ReactNode,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const AppShell = forwardRef(function AppShell({ title = 'Vami Platform', navigation, sidebar, children, userMenu, className = '', style = {}, ...rest }, ref) {
  const { activeMode, toggleMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return React.createElement(
    'div',
    {
      ref,
      className,
      style: {
        minHeight: '100vh',
        background: 'var(--vami-color-background-primary, #ffffff)',
        color: 'var(--vami-color-text-primary, #0f172a)',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'var(--vami-typography-font-sans, sans-serif)',
        transition: 'background 0.25s ease, color 0.25s ease',
        ...style,
      },
      ...rest,
    },
    // Sidebar (Full Height Left)
    sidebar &&
      React.createElement(
        'aside',
        {
          style: {
            width: '260px',
            background: 'var(--vami-color-background-secondary, #f8fafc)',
            padding: '24px 16px',
            display: sidebarOpen || typeof window === 'undefined' || window.innerWidth >= 768 ? 'flex' : 'none',
            flexDirection: 'column',
            borderRight: '1px solid var(--vami-color-border-subtle, #e2e8f0)',
          },
        },
        sidebar
      ),
    // Right Content Column
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        },
      },
      // Header Navigation Bar (Inside Right Column)
      React.createElement(
        'header',
        {
          style: {
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'transparent',
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
                  display: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'none' : 'block',
                },
                'aria-label': 'Toggle Navigation Sidebar',
              },
              '☰'
            ),
          navigation
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
          // Light / Dark Mode Switcher Button
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: toggleMode,
              style: {
                background: 'transparent',
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
      // Main Content Area
      React.createElement(
        'main',
        {
          style: {
            flex: 1,
            padding: '0 32px 32px 32px',
            maxWidth: '1600px',
            margin: '0',
            width: '100%',
            boxSizing: 'border-box',
          },
        },
        children
      )
    )
  );
});


