import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Fix Windows DNS SRV lookup issues for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Manually load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Import Models
import Admin from '../models/Admin.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import BlogPost from '../models/BlogPost.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const mockImages = [
  'https://loremflickr.com/800/800/bronze,casting',
  'https://loremflickr.com/800/800/copper,pipe',
  'https://loremflickr.com/800/800/brass,metal',
  'https://loremflickr.com/800/800/copper,heatsink'
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Wiping database collections...');
    await Admin.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('Database wiped.');

    // 1. Admin Seeding
    console.log('Seeding Admin...');
    const hashedPassword = await bcrypt.hash('Ko9vLhp9DI3EX44G', 10);
    await Admin.create({
      email: 'admin@smalloys.com',
      passwordHash: hashedPassword
    });

    // 2. Category Seeding
    console.log('Seeding Categories...');
    const categoriesData = [
      {
        name: 'Bronze & Brass Sand Castings',
        slug: 'bronze-brass-sand-castings',
        description: 'High-strength bronze and brass alloys perfect for industrial pump, valve, and structural components.',
        image: mockImages[0],
        seoTitle: 'Premium Bronze Castings | Smalloys',
        seoDescription: 'Browse our extensive catalog of marine-grade bronze and brass castings.'
      },
      {
        name: 'Copper-Nickel Alloys (C96400 / C71500)',
        slug: 'copper-nickel-alloys',
        description: 'Exceptional corrosion resistance for marine hardware and heavy-duty piping systems.',
        image: mockImages[1],
        seoTitle: 'Copper-Nickel Marine Alloys | Smalloys'
      },
      // EDGE CASE: Missing description, missing image, missing SEO
      {
        name: 'Silicon Brass & Copper',
        slug: 'silicon-brass-copper',
      },
      // EDGE CASE: Massively long description to test overflow, complex slug
      {
        name: 'High-Conductivity Electrolytic Tough Pitch Copper Components for EV and Electrical Systems',
        slug: 'high-conductivity-electrolytic-tough-pitch-copper-components',
        description: 'This category contains extremely pure copper castings that are specifically engineered to deliver maximum electrical and thermal conductivity for next-generation electric vehicle rotors and high-voltage power transmission systems. '.repeat(10), // Repeats to create a massive string
        image: mockImages[2]
      }
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    
    // 3. Product Seeding
    console.log('Seeding Products...');
    
    // Helper to generate 20 variants (Edge Case)
    const massiveVariants = Array.from({ length: 20 }).map((_, i) => ({
      name: `Diameter ${i + 1}0mm`,
      priceNote: `Request Quote - MOQ ${i * 10}kg`
    }));

    // Helper to generate 30 specs (Edge Case)
    const massiveSpecs = Array.from({ length: 30 }).map((_, i) => ({
      key: `Parameter Metric ${i}`,
      value: `${(Math.random() * 100).toFixed(2)} MPa`
    }));

    const productsData = [
      // Product 1: Standard
      {
        name: 'C95800 Nickel-Aluminum Bronze Pump Casing',
        slug: 'c95800-nickel-aluminum-bronze-casing',
        category: insertedCategories[0]._id,
        shortDescription: 'The "workhorse" of the marine pump industry.',
        longDescription: '<p><strong>C95800</strong> (Nickel-Aluminum Bronze) is widely used for seawater applications. It features excellent corrosion resistance and superior mechanical properties.</p><ul><li>High strength and durability</li><li>Excellent marine corrosion resistance</li></ul>',
        specs: [
          { key: 'Density', value: '7.64 g/cm³' },
          { key: 'Yield Strength', value: '310 MPa' }
        ],
        variants: [{ name: 'Standard Sand Cast' }, { name: 'Precision Machined', priceNote: '+15% Premium' }],
        images: [mockImages[0], mockImages[1]],
        featured: true,
        status: 'published'
      },
      // Product 2: EDGE CASE - No Images, No Variants, Draft Status
      {
        name: 'C87850 EcoBrass Valve Body Experimental',
        slug: 'c87850-ecobrass-experimental',
        category: insertedCategories[1]._id,
        shortDescription: 'Lead-free brass testing batch.',
        status: 'draft',
        specs: [] // Empty specs
      },
      // Product 3: EDGE CASE - Massive Variants and Specs
      {
        name: 'Marine Grade CuNi 70/30 High-Pressure Flange',
        slug: 'marine-grade-cuni-70-30-flange',
        category: insertedCategories[2]._id,
        shortDescription: 'Highly customizable structural marine flange.',
        longDescription: '<h2>Massive Specification Sheet</h2><p>This product tests the UI limits for tables and sticky sidebars.</p>',
        specs: massiveSpecs,
        variants: massiveVariants,
        images: [mockImages[3]],
        featured: true,
        status: 'published'
      },
      // Product 4: EDGE CASE - Massive Rich Text HTML
      {
        name: 'High-Pressure Cast Copper Heat Sink',
        slug: 'high-pressure-cast-copper-heat-sink',
        category: insertedCategories[3]._id,
        shortDescription: 'Extreme thermal conductivity.',
        longDescription: `
          <h2>Technical Overview</h2>
          <p>This pure copper heat sink is produced using high-pressure die casting to ensure zero porosity and absolute maximum thermal conductivity for EV systems.</p>
          <blockquote>"The standard of industry for thermal management."</blockquote>
          <h3>Chemical Composition</h3>
          <table border="1">
            <tr><th>Element</th><th>Percentage</th></tr>
            <tr><td>Copper (Cu)</td><td>99.9% Min</td></tr>
            <tr><td>Oxygen (O)</td><td>0.04% Max</td></tr>
          </table>
          <p>More paragraphs... </p>
          <p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20)}</p>
        `,
        specs: [{ key: 'Thermal Conductivity', value: '390 W/m·K' }],
        images: [mockImages[2]],
        status: 'published'
      }
    ];

    await Product.insertMany(productsData);

    // 4. BlogPost Seeding
    console.log('Seeding Blog Posts...');
    const blogData = [
      {
        title: 'The Future of Copper Die Casting in EVs',
        slug: 'future-copper-casting-evs',
        coverImage: mockImages[1],
        content: `<h2>The Rise of Copper Rotors</h2><p>As electric vehicles demand higher efficiency, the shift toward high-purity copper casting accelerates.</p><p>${'This is a very long paragraph detailing thermal dynamics. '.repeat(30)}</p>`,
        excerpt: 'An exploration into the high-conductivity materials defining the next generation of EVs.',
        tags: ['Automotive', 'Copper', 'Innovation'],
        status: 'published',
        publishedAt: new Date()
      },
      // EDGE CASE: Massive title, no cover image, no tags, zero excerpt
      {
        title: 'An In-Depth Computational Analysis of Micro-Porosity in High-Pressure Sand Cast Nickel-Aluminum Bronze Matrices Over a 10-Year Stress Period Under Variable Marine Loads',
        slug: 'in-depth-computational-analysis-micro-porosity-bronze',
        content: '<p>Detailed analysis data goes here.</p>',
        status: 'published',
        publishedAt: new Date(Date.now() - 864000000) // 10 days ago
      },
      // EDGE CASE: Draft post scheduled for future
      {
        title: 'Upcoming Q4 Material Pricing Trends',
        slug: 'q4-material-pricing-trends',
        coverImage: mockImages[0],
        content: '<p>Draft content for future release.</p>',
        status: 'draft',
        tags: ['Business', 'Pricing'],
        publishedAt: new Date(Date.now() + 864000000) // 10 days in future
      }
    ];

    await BlogPost.insertMany(blogData);

    console.log('Seeding completely successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
