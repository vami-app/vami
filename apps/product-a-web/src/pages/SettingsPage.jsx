import React from 'react';
import { Box, Container, Stack, Card, Heading, Text, Input, Button } from '@vami/ui';

/**
 * SettingsPage - Split Pane / Master-Detail Layout
 *
 * FAANG Grade Principles Implemented:
 * 1. Scaffold Pattern: Fixed sidebar (nav) with a scrolling main content area.
 * 2. Flexbox wrapping: On smaller screens, flexWrap pushes the content down, naturally stacking it.
 * 3. Semantic Tokens: Form elements inherit design language via CSS variables.
 */
export function SettingsPage() {
  return (
    <Container maxWidth="xl" padding="lg">
      <Heading level={1} size="xl2" style={{ marginBottom: 'var(--spacing-lg)' }}>
        Settings
      </Heading>

      <Box 
        display="flex" 
        style={{ flexWrap: 'wrap', gap: 'var(--spacing-xl)', alignItems: 'flex-start' }}
      >
        {/* Sidebar / Master Navigation */}
        <Box style={{ flex: '1 1 250px', minWidth: '200px' }}>
          <Stack spacing="xs">
            <Button variant="primary" style={{ justifyContent: 'flex-start' }}>Profile Details</Button>
            <Button variant="outline" style={{ justifyContent: 'flex-start' }}>Security</Button>
            <Button variant="outline" style={{ justifyContent: 'flex-start' }}>Notifications</Button>
            <Button variant="outline" style={{ justifyContent: 'flex-start' }}>Billing</Button>
          </Stack>
        </Box>

        {/* Content Pane / Detail */}
        <Box style={{ flex: '3 1 600px' }}>
          <Card padding="xl">
            <Stack spacing="lg">
              <Box style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--spacing-md)' }}>
                <Heading level={2} size="lg">Profile Details</Heading>
                <Text variant="subtle">Manage your personal information and preferences.</Text>
              </Box>

              <form onSubmit={(e) => e.preventDefault()}>
                <Stack spacing="md">
                  <Box>
                    <Text size="sm" style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Full Name</Text>
                    <Input placeholder="John Doe" type="text" />
                  </Box>
                  <Box>
                    <Text size="sm" style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Email Address</Text>
                    <Input placeholder="john@example.com" type="email" />
                  </Box>
                  <Box>
                    <Text size="sm" style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Company Role</Text>
                    <Input placeholder="Software Engineer" type="text" />
                  </Box>
                  
                  <Box style={{ marginTop: 'var(--spacing-md)' }}>
                    <Button type="submit" variant="primary">Save Changes</Button>
                  </Box>
                </Stack>
              </form>
            </Stack>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
