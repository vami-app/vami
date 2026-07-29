import React from 'react';
import { Box, Container, Grid, Stack, Card, Heading, Text, Badge, Avatar, Button, Icon } from '@vami/ui';

// --- Custom SVGs for FAANG Grade UI ---

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="var(--vami-color-brand-accent)" />
    <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="url(#grad)" fillOpacity="0.8" />
    <defs>
      <linearGradient id="grad" x1="16" y1="9" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--vami-color-brand-accent)" />
        <stop offset="1" stopColor="var(--vami-color-brand-hover)" />
      </linearGradient>
    </defs>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ArchiveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"></polyline>
    <rect x="1" y="3" width="22" height="5"></rect>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
);


// --- Data Visualizations (Inline SVG) ---

const DonutChart = () => (
  <Box position="relative" width="200px" height="200px" style={{ margin: '0 auto' }}>
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: 'drop-shadow(0 0 8px rgba(164, 133, 255, 0.4))' }}>
      {/* Outer Cyan */}
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2A2742" strokeWidth="8" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--vami-color-cyan)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="62.8" strokeLinecap="round" transform="rotate(-90 50 50)" />
      
      {/* Middle Purple */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="#2A2742" strokeWidth="8" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="var(--vami-color-brand-accent)" strokeWidth="8" strokeDasharray="188.4" strokeDashoffset="82" strokeLinecap="round" transform="rotate(-90 50 50)" />
      
      {/* Inner Blue (simulated with brand-hover for now) */}
      <circle cx="50" cy="50" r="20" fill="none" stroke="#2A2742" strokeWidth="8" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="125.6" strokeDashoffset="68" strokeLinecap="round" transform="rotate(-90 50 50)" />
    </svg>
  </Box>
);

const SparkLine = ({ color = 'var(--vami-color-brand-accent)', type = 'up' }) => (
  <svg width="100%" height="60px" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ filter: `drop-shadow(0 4px 6px ${color}40)` }}>
    <path 
      d={type === 'up' ? "M 0 30 Q 20 40, 40 20 T 70 15 T 100 5" : "M 0 10 Q 20 0, 40 20 T 70 30 T 100 25"} 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <circle cx="100" cy={type === 'up' ? 5 : 25} r="3" fill="#fff" stroke={color} strokeWidth="1.5" />
  </svg>
);

const AreaChart = () => (
  <Box width="100%" height="160px" position="relative" mt="lg">
    <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--vami-color-brand-accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--vami-color-brand-accent)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      <line x1="0" y1="20" x2="400" y2="20" stroke="var(--vami-color-border-subtle)" strokeDasharray="4 4" />
      <line x1="0" y1="50" x2="400" y2="50" stroke="var(--vami-color-border-subtle)" strokeDasharray="4 4" />
      <line x1="0" y1="80" x2="400" y2="80" stroke="var(--vami-color-border-subtle)" strokeDasharray="4 4" />
      <line x1="0" y1="110" x2="400" y2="110" stroke="var(--vami-color-border-subtle)" strokeDasharray="4 4" />
      
      {/* Labels */}
      <text x="0" y="20" fill="var(--vami-color-text-subtle)" fontSize="10">$1000</text>
      <text x="0" y="50" fill="var(--vami-color-text-subtle)" fontSize="10">$500</text>
      <text x="0" y="80" fill="var(--vami-color-text-subtle)" fontSize="10">$200</text>
      <text x="0" y="110" fill="var(--vami-color-text-subtle)" fontSize="10">$100</text>

      {/* Path */}
      <path 
        d="M 50 110 Q 100 110, 150 70 T 250 80 T 350 40 T 400 50 L 400 120 L 50 120 Z" 
        fill="url(#area-grad)" 
      />
      <path 
        d="M 50 110 Q 100 110, 150 70 T 250 80 T 350 40 T 400 50" 
        fill="none" 
        stroke="var(--vami-color-brand-accent)" 
        strokeWidth="3" 
        style={{ filter: 'drop-shadow(0 2px 4px var(--vami-color-brand-accent))' }}
      />
      
      {/* Tooltip point */}
      <circle cx="315" cy="55" r="4" fill="#fff" stroke="var(--vami-color-brand-accent)" strokeWidth="2" />
      <line x1="315" y1="55" x2="315" y2="120" stroke="var(--vami-color-brand-accent)" strokeDasharray="2 2" />
    </svg>
    
    {/* Tooltip Overlay */}
    <Box position="absolute" top="-10px" left="220px" background="var(--vami-color-background-primary)" border="1px solid var(--vami-color-border-subtle)" padding="xs" borderRadius="md" style={{ boxShadow: 'var(--vami-shadow-md)' }}>
      <Text size="xs" color="var(--vami-color-text-subtle)">29 July 00:00</Text>
      <Box display="flex" alignItems="center" gap="sm">
        <Text weight="bold" size="sm">220,342.76</Text>
        <Badge variant="success" style={{ padding: '0 4px', fontSize: '10px' }}>+3.4%</Badge>
      </Box>
    </Box>
  </Box>
);

// --- Layout Sidebar ---

export const DashboardSidebar = () => {
  const NavItem = ({ icon, label, active }) => (
    <Box 
      display="flex" 
      alignItems="center" 
      gap="md" 
      padding="sm md" 
      borderRadius="md"
      background={active ? 'linear-gradient(90deg, rgba(164,133,255,0.15) 0%, rgba(164,133,255,0) 100%)' : 'transparent'}
      style={{
        cursor: 'pointer',
        color: active ? 'var(--vami-color-text-primary)' : 'var(--vami-color-text-subtle)',
        borderLeft: active ? '3px solid var(--vami-color-brand-accent)' : '3px solid transparent',
        transition: 'all 0.2s',
      }}
    >
      {icon}
      <Text size="sm" weight={active ? '600' : '500'} color="inherit">{label}</Text>
    </Box>
  );

  return (
    <Stack gap="xl" style={{ height: '100%' }}>
      <Box display="flex" alignItems="center" gap="sm" mb="md">
        <LogoIcon />
        <Box>
          <Text size="xs" color="var(--vami-color-text-subtle)">v.0.04</Text>
        </Box>
      </Box>

      <Stack gap="sm">
        <Text size="xs" weight="bold" color="var(--vami-color-text-subtle)" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} mb="xs">Favourites</Text>
        <NavItem icon={<FileIcon />} label="Monthly reports" />
        <NavItem icon={<FileIcon />} label="DS Documentation" />
        <NavItem icon={<FolderIcon />} label="2023 Test Reports" />
      </Stack>

      <Stack gap="sm" style={{ flex: 1 }}>
        <Text size="xs" weight="bold" color="var(--vami-color-text-subtle)" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} mb="xs">Main menu</Text>
        <NavItem icon={<DashboardIcon />} label="Dashboard" active />
        <NavItem icon={<GridIcon />} label="Applications" />
        <NavItem icon={<CalendarIcon />} label="Calendar" />
        <NavItem icon={<Box>+</Box>} label="Add Function" />
      </Stack>

      <Stack gap="sm">
        <NavItem icon={<ArchiveIcon />} label="Archive" />
      </Stack>
    </Stack>
  );
};


// --- Main Dashboard Page ---

export function DashboardPage() {
  return (
    <Box style={{ width: '100%' }}>
      
      {/* Top Bar inside content area */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="xl">
        <Box>
          <Text size="sm" color="var(--vami-color-text-subtle)" mb="xs">Dashboard <span style={{color: 'var(--vami-color-text-secondary)'}}>/ Overview</span></Text>
          <Heading level={1} style={{ fontSize: '28px', marginBottom: '4px' }}>Hello Thomas,</Heading>
          <Text size="sm" color="var(--vami-color-text-subtle)">
            <span style={{ color: 'var(--vami-color-brand-accent)', textDecoration: 'underline', cursor: 'pointer' }}>Click here</span> to setup your double authentication.
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap="lg">
          <Box display="flex" alignItems="center" gap="sm" color="var(--vami-color-text-subtle)" style={{ cursor: 'pointer' }}>
            <SearchIcon />
            <Text size="sm" color="inherit">Click here to search</Text>
          </Box>
          <Box color="var(--vami-color-text-subtle)" style={{ cursor: 'pointer' }}>
            <UserIcon />
          </Box>
          <Button style={{ background: 'var(--vami-color-brand-accent)', color: '#fff', borderRadius: '8px' }}>
            Edit dashboard
          </Button>
        </Box>
      </Box>

      {/* Grid Layout Engine */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1fr',
        gridAutoRows: 'minmax(200px, auto)',
        gap: '24px',
      }}>
        
        {/* Quarterly Overview */}
        <Card style={{ gridColumn: '1 / 2', gridRow: '1 / 3', background: 'var(--vami-color-surface-card)' }}>
          <Stack gap="lg" align="center" style={{ height: '100%', justifyContent: 'center' }}>
            <Heading level={3} style={{ alignSelf: 'flex-start', fontSize: '16px' }}>Quarterly Overview</Heading>
            <Box position="relative" width="100%">
              <DonutChart />
              <Box position="absolute" top="0" right="0" display="flex" flexDirection="column" gap="md" style={{ transform: 'translate(20%, 30%)' }}>
                <Box>
                  <Box display="flex" alignItems="center" gap="sm">
                    <Box width="8px" height="8px" borderRadius="50%" background="var(--vami-color-cyan)" />
                    <Heading level={2} style={{ fontSize: '24px' }}>26.9%</Heading>
                    <Text size="xs" color="var(--vami-color-success)">↑ 856</Text>
                  </Box>
                  <Text size="xs" color="var(--vami-color-text-subtle)" style={{ marginLeft: '16px' }}>New orders</Text>
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap="sm">
                    <Box width="8px" height="8px" borderRadius="50%" background="var(--vami-color-brand-accent)" />
                    <Heading level={2} style={{ fontSize: '24px' }}>56.2%</Heading>
                    <Text size="xs" color="var(--vami-color-success)">↑ 1,892</Text>
                  </Box>
                  <Text size="xs" color="var(--vami-color-text-subtle)" style={{ marginLeft: '16px' }}>Completed sales</Text>
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap="sm">
                    <Box width="8px" height="8px" borderRadius="50%" background="#3b82f6" />
                    <Heading level={2} style={{ fontSize: '24px' }}>45.9%</Heading>
                    <Text size="xs" color="var(--vami-color-success)">↑ 3,985</Text>
                  </Box>
                  <Text size="xs" color="var(--vami-color-text-subtle)" style={{ marginLeft: '16px' }}>Page views</Text>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Subscriptions */}
        <Card style={{ gridColumn: '2 / 3', gridRow: '1 / 2', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Box display="flex" flexDirection="column" justifyContent="space-between" width="50%">
            <Text size="sm" weight="600" mb="sm">Subscriptions</Text>
            <Box display="flex" alignItems="center" gap="sm">
              <Heading level={1} style={{ fontSize: '32px' }}>278</Heading>
              <Text size="xs" color="var(--vami-color-success)">↑ 16.2%</Text>
            </Box>
            <Box mt="md" display="flex" alignItems="center" gap="xs">
              <Text size="xs" color="var(--vami-color-text-subtle)">Weekly</Text>
              <Text size="xs" color="var(--vami-color-text-subtle)">⌄</Text>
            </Box>
          </Box>
          <Box width="50%" position="relative">
             <Badge variant="subtle" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--vami-color-background-subdued)', color: '#fff', border: '1px solid var(--vami-color-border-subtle)' }}>+278 <span style={{color: 'var(--vami-color-danger)', marginLeft: '4px'}}>-4</span></Badge>
             <Box mt="xl">
               <SparkLine color="var(--vami-color-brand-accent)" type="up" />
             </Box>
          </Box>
        </Card>

        {/* Avg. Order Value */}
        <Card style={{ gridColumn: '3 / 4', gridRow: '1 / 2', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Box display="flex" flexDirection="column" justifyContent="space-between" width="50%">
            <Text size="sm" weight="600" mb="sm">Avg. Order Value</Text>
            <Box display="flex" alignItems="center" gap="sm">
              <Heading level={1} style={{ fontSize: '32px' }}>$182.70</Heading>
              <Text size="xs" color="var(--vami-color-danger)">↓ 3.6%</Text>
            </Box>
            <Box mt="md" display="flex" alignItems="center" gap="xs">
              <Text size="xs" color="var(--vami-color-text-subtle)">Weekly</Text>
              <Text size="xs" color="var(--vami-color-text-subtle)">⌄</Text>
            </Box>
          </Box>
          <Box width="50%" position="relative">
             <Badge variant="subtle" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--vami-color-background-subdued)', color: '#fff', border: '1px solid var(--vami-color-border-subtle)' }}>$180.70 <span style={{color: 'var(--vami-color-danger)', marginLeft: '4px'}}>-23.60</span></Badge>
             <Box mt="xl">
               <SparkLine color="var(--vami-color-cyan)" type="down" />
             </Box>
          </Box>
        </Card>

        {/* Calendar */}
        <Card style={{ gridColumn: '2 / 3', gridRow: '2 / 3' }}>
          <Text size="sm" weight="600" mb="md">Calendar</Text>
          <Box display="flex" gap="md">
            <Box flex="1" borderRight="1px solid var(--vami-color-border-subtle)" pr="md">
              <Stack gap="md">
                <Box>
                  <Box display="flex" alignItems="center" gap="xs">
                    <Box width="6px" height="6px" borderRadius="50%" background="var(--vami-color-success)" />
                    <Text size="xs" weight="600">9:30 - 10:30 AM</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt="xs" ml="sm">
                    <Text size="xs" color="var(--vami-color-text-subtle)">Backlog Refinement</Text>
                    <Text size="xs" color="var(--vami-color-brand-accent)">Join</Text>
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap="xs">
                    <Box width="6px" height="6px" borderRadius="50%" background="var(--vami-color-success)" />
                    <Text size="xs" weight="600">10:30 - 11:30 AM</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt="xs" ml="sm">
                    <Text size="xs" color="var(--vami-color-text-subtle)">DS Status - Process</Text>
                    <Text size="xs" color="var(--vami-color-brand-accent)">Join</Text>
                  </Box>
                </Box>
              </Stack>
            </Box>
            <Box width="100px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
               <Text size="sm" mb="xs">Thursday</Text>
               <Heading level={1} style={{ fontSize: '42px', margin: 0 }}>16th</Heading>
               <Text size="sm">April</Text>
            </Box>
          </Box>
        </Card>

        {/* Latest Releases */}
        <Card style={{ gridColumn: '3 / 4', gridRow: '2 / 4' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="md">
            <Text size="sm" weight="600">Latest Releases</Text>
            <Text size="xs" color="var(--vami-color-text-subtle)">Latest ⌄</Text>
          </Box>
          <Stack gap="md">
            {/* Item 1 */}
            <Box padding="md" borderLeft="3px solid var(--vami-color-success)" background="var(--vami-color-background-subdued)" borderRadius="sm">
               <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm">
                 <Box display="flex" gap="sm" alignItems="center">
                   <Badge variant="success" style={{ background: 'var(--vami-color-success)', color: '#000' }}>LIVE EXP</Badge>
                   <Text size="xs" color="var(--vami-color-text-subtle)">End 12 May 2024</Text>
                 </Box>
                 <Box display="flex" style={{ marginLeft: '-10px' }}>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>A</Avatar.Fallback></Avatar.Root>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>B</Avatar.Fallback></Avatar.Root>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>C</Avatar.Fallback></Avatar.Root>
                 </Box>
               </Box>
               <Text size="sm" weight="600" mb="md">A/B Test - Bundling in Product Details Page | above the fold</Text>
               <Box display="flex" justifyContent="space-between">
                 <Text size="xs" color="var(--vami-color-text-subtle)">Last updated Thu 16 April 2024</Text>
                 <Text size="xs" weight="bold">OPTI</Text>
               </Box>
            </Box>
            
            {/* Item 2 */}
            <Box padding="md" borderLeft="3px solid var(--vami-color-brand-accent)" background="var(--vami-color-background-subdued)" borderRadius="sm">
               <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm">
                 <Badge variant="brand">RELEASED</Badge>
                 <Box display="flex" style={{ marginLeft: '-10px' }}>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>D</Avatar.Fallback></Avatar.Root>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>E</Avatar.Fallback></Avatar.Root>
                 </Box>
               </Box>
               <Text size="sm" weight="600" mb="md">Customer Experience Enhancement Initiative - Stock availability</Text>
               <Box display="flex" justifyContent="space-between">
                 <Text size="xs" color="var(--vami-color-text-subtle)">Last updated Thu 16 April 2024</Text>
                 <Text size="xs" weight="bold">JUMBO</Text>
               </Box>
            </Box>

            {/* Item 3 */}
            <Box padding="md" borderLeft="3px solid var(--vami-color-brand-accent)" background="var(--vami-color-background-subdued)" borderRadius="sm">
               <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm">
                 <Badge variant="brand">RELEASED</Badge>
                 <Box display="flex" style={{ marginLeft: '-10px' }}>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>F</Avatar.Fallback></Avatar.Root>
                   <Avatar.Root style={{ width: 24, height: 24, border: '2px solid var(--vami-color-surface-card)', marginLeft: '-8px' }}><Avatar.Fallback>G</Avatar.Fallback></Avatar.Root>
                 </Box>
               </Box>
               <Text size="sm" weight="600" mb="md">Sustainability Initiative - Promote products that are sustainably prod...</Text>
            </Box>
          </Stack>
        </Card>

        {/* Asset Generated */}
        <Card style={{ gridColumn: '1 / 3', gridRow: '3 / 4', position: 'relative', overflow: 'hidden' }}>
           <Box position="absolute" bottom="0" left="0" width="300px" height="100px" background="linear-gradient(90deg, rgba(164,133,255,0.8) 0%, rgba(164,133,255,0) 100%)" style={{ filter: 'blur(50px)', opacity: 0.3 }} />
           
           <Box display="flex">
             <Box width="40%">
               <Text size="sm" weight="600" mb="sm">Asset Generated</Text>
               <Box display="flex" alignItems="center" gap="sm">
                 <Heading level={1} style={{ fontSize: '36px' }}>128,7K</Heading>
                 <Text size="xs" color="var(--vami-color-success)">↑ 18.3%</Text>
               </Box>
               <Text size="xs" color="var(--vami-color-text-subtle)" mt="lg" style={{ lineHeight: '1.5' }}>
                 Increasing the average order<br/>
                 value fosters sustainable growth,<br/>
                 amplifying revenue streams.
               </Text>
               
               <Box mt="xl">
                 <Button style={{ background: 'linear-gradient(90deg, var(--vami-color-brand-accent) 0%, #3b82f6 100%)', color: '#fff', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Box width="20px" height="20px" border="2px solid #fff" borderRadius="50%" display="flex" alignItems="center" justifyContent="center">
                     <Box width="10px" height="2px" background="#fff" />
                   </Box>
                   Get the extension
                 </Button>
               </Box>
             </Box>
             
             <Box width="60%">
                <AreaChart />
             </Box>
           </Box>
        </Card>

      </div>
    </Box>
  );
}
