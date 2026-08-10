/**
 * Approved marketing content from the RMA website review roadmap.
 * Used as public fallbacks when CMS entries are empty / draft.
 */

export const CAPABILITIES_SECTIONS = [
  {
    title: 'Raw Material Selection',
    description: 'Verified feedstock matched to grade and chemistry requirements.',
    order: 0,
  },
  {
    title: 'Melting & Alloying',
    description: 'Controlled melting and alloy chemistry for copper, brass and phosphor bronze programmes.',
    order: 1,
  },
  {
    title: 'Casting',
    description: 'Custom and catalogue castings to customer drawings and specifications.',
    order: 2,
  },
  {
    title: 'Rolling / Forming',
    description: 'Sheets, plates and circles formed to dimensional requirements.',
    order: 3,
  },
  {
    title: 'Machining / Finishing',
    description: 'Finishing and machining as required for delivery-ready parts.',
    order: 4,
  },
  {
    title: 'Quality Inspection',
    description: 'Chemical, dimensional and visual checks before dispatch.',
    order: 5,
  },
  {
    title: 'Packing & Dispatch',
    description: 'Secure packing with lot identification and documentation.',
    order: 6,
  },
];

export const QUALITY_SECTIONS = [
  { title: 'Chemical Analysis', description: 'Alloy chemistry verification against specified grades.', order: 0 },
  { title: 'Mechanical Testing', description: 'Mechanical properties where required by the order.', order: 1 },
  { title: 'Dimensional Inspection', description: 'Controlled dimensions and tolerances per specification.', order: 2 },
  { title: 'Visual Inspection', description: 'Surface and workmanship checks before packing.', order: 3 },
  { title: 'Material Traceability', description: 'Batch / heat-wise identification where applicable.', order: 4 },
  { title: 'Third-Party Testing', description: 'External laboratory reports when called out on the RFQ.', order: 5 },
  { title: 'Material Test Certificates', description: 'Company TC with each shipment as standard.', order: 6 },
  { title: 'Inspection Reports', description: 'Inspection documentation aligned to order requirements.', order: 7 },
];

export const INDUSTRIES_SECTIONS = [
  { title: 'Electrical & Power', description: 'High-conductivity copper for busbars, switchgear and power distribution.', order: 0 },
  { title: 'Automotive', description: 'Brass and copper products for radiators, stampings and heat exchange.', order: 1 },
  { title: 'General Engineering', description: 'Sheets, plates and circles for fabrication and OEM programmes.', order: 2 },
  { title: 'Pumps & Valves', description: 'Bronze and brass components for fluid-handling equipment.', order: 3 },
  { title: 'Bearings & Bushes', description: 'Phosphor bronze and related alloys for wear applications.', order: 4 },
  { title: 'Industrial Machinery', description: 'Mill products and castings for machinery builders.', order: 5 },
];

export const WHY_RMA_SECTIONS = [
  { title: 'Consistent Chemical Composition', description: 'Controlled alloy chemistry according to specified grades.', order: 0 },
  { title: 'Custom Manufacturing', description: 'Products manufactured to customer drawings and specifications.', order: 1 },
  { title: 'Dimensional Accuracy', description: 'Controlled dimensions and tolerances.', order: 2 },
  { title: 'Material Traceability', description: 'Batch/heat-wise identification where applicable.', order: 3 },
  { title: 'Quality Documentation', description: 'MTCs, inspection reports and laboratory reports as required.', order: 4 },
  { title: 'Reliable Supply', description: 'Focus on consistency and delivery schedules.', order: 5 },
];

export const HOME_GALLERY_ITEMS = [
  { title: 'Copper sheets', imageUrl: '/images/copper_sheets_1785916944432.png', order: 0 },
  { title: 'Brass plates', imageUrl: '/images/brass_plates_1785916962925.png', order: 1 },
  { title: 'Phosphor bronze', imageUrl: '/images/phosphor_bronze_1785916974107.png', order: 2 },
  { title: 'Ingots', imageUrl: '/images/nonferrous_ingots_1785916984591.png', order: 3 },
];

export const SAMPLE_CERTIFICATES = [
  {
    _id: 'sample-tc',
    title: 'Company Test Certificate (Sample)',
    description: 'Sample manufacturer test certificate covering chemical composition and dimensions.',
    issuedBy: 'Radhey Metal Alloys LLP',
    fileUrl: '/images/logo.png',
  },
  {
    _id: 'sample-lab',
    title: 'Third-Party Laboratory Report (Sample)',
    description: 'Sample laboratory report layout. Live reports are issued when requested on RFQ.',
    issuedBy: 'External laboratory',
    fileUrl: '/images/logo.png',
  },
];

export const SAMPLE_RESOURCES = [
  {
    _id: 'sample-catalogue',
    title: 'Product Catalogue',
    type: 'catalogue',
    description: 'Overview of copper, brass, phosphor bronze and casting programmes.',
    fileUrl: '/images/logo.png',
  },
  {
    _id: 'sample-tds',
    title: 'ETP Copper — Technical Data Sheet',
    type: 'tds',
    description: 'C11000 typical properties for buyer engineering packs.',
    fileUrl: '/images/copper_sheets_1785916944432.png',
  },
  {
    _id: 'sample-profile',
    title: 'Company Profile',
    type: 'company_profile',
    description: 'Corporate capability overview for procurement teams.',
    fileUrl: '/images/logo.png',
  },
];
