import React from 'react';
import { Box, Container, Stack, Card, Heading, Text, Avatar, Button } from '@vami/ui';

/**
 * FeedPage - Linear Stack / Constrained Prose Layout
 *
 * FAANG Grade Principles Implemented:
 * 1. Line-length optimization: The container is constrained to a narrow width (e.g. 65ch equivalent) for optimal reading.
 * 2. Vertical Rhythm: Uses Stack gap properties for consistent spacing without margin-collapsing edge cases.
 * 3. Atomic Composition: Combining avatars, text, and buttons to create reusable feed items.
 */
export function FeedPage() {
  const posts = [
    {
      id: 1,
      author: 'Jane Smith',
      time: '2 hrs ago',
      content: 'Just deployed the new unified identity service! 🚀 The transition to stateless JWTs went incredibly smoothly. The new architecture should easily handle our Black Friday scale.',
      likes: 42
    },
    {
      id: 2,
      author: 'Design Team',
      time: '5 hrs ago',
      content: 'We\'ve just finalized the Tier 2 Semantic Tokens for the new dark mode theme. Engineering can start integrating them today by pulling the latest from @vami/design-tokens.',
      likes: 128
    },
    {
      id: 3,
      author: 'System Alert',
      time: '1 day ago',
      content: 'Maintenance notice: We will be upgrading the primary database cluster to PostgreSQL 16 this weekend. Expect a 10-minute read-only window.',
      likes: 5
    }
  ];

  return (
    <Container size="md" padding="lg" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Stack gap="var(--spacing-xl, 32px)">
        <Box style={{ textAlign: 'center', paddingBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <Heading level={1}>Activity Feed</Heading>
          <Text color="var(--vami-color-text-secondary, #475569)">Stay updated with the latest team updates.</Text>
        </Box>

        {posts.map((post) => (
          <Card key={post.id} padding="lg">
            <Stack gap="var(--spacing-md, 16px)">
              <Box display="flex" alignItems="center" style={{ gap: 'var(--spacing-md)' }}>
                <Avatar.Root style={{ width: 40, height: 40 }}>
                  <Avatar.Fallback>{post.author[0]}</Avatar.Fallback>
                </Avatar.Root>
                <Stack gap="0">
                  <Text style={{ fontWeight: 'bold' }}>{post.author}</Text>
                  <Text color="var(--vami-color-text-secondary, #475569)" size="sm">{post.time}</Text>
                </Stack>
              </Box>
              
              <Text style={{ lineHeight: '1.6' }}>
                {post.content}
              </Text>
              
              <Box display="flex" style={{ gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                <Button variant="subdued">Like ({post.likes})</Button>
                <Button variant="subdued">Comment</Button>
              </Box>
            </Stack>
          </Card>
        ))}
        
        <Box display="flex" justifyContent="center" style={{ marginTop: 'var(--spacing-lg)' }}>
          <Button variant="primary">Load More Activity</Button>
        </Box>
      </Stack>
    </Container>
  );
}
