import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531327431456-837da4b1d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
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
        name: 'Titanium Alloys',
        slug: 'titanium-alloys',
        description: 'High-strength, low-weight titanium alloys designed for extreme aerospace and medical applications.',
        image: mockImages[0],
        seoTitle: 'Premium Titanium Alloys | Smalloys',
        seoDescription: 'Browse our extensive catalog of aerospace-grade titanium alloys.'
      },
      {
        name: 'Nickel Superalloys',
        slug: 'nickel-superalloys',
        description: 'Exceptional high-temperature strength and oxidation resistance for gas turbines and jet engines.',
        image: mockImages[1],
        seoTitle: 'Nickel Superalloys for High Heat | Smalloys'
      },
      // EDGE CASE: Missing description, missing image, missing SEO
      {
        name: 'Carbon Composites',
        slug: 'carbon-composites',
      },
      // EDGE CASE: Massively long description to test overflow, complex slug
      {
        name: 'Extremely High-Temperature Aerospace-Grade Precision Metals & Advanced Composites',
        slug: 'extremely-high-temperature-aerospace-grade-precision-metals-and-advanced-composites',
        description: 'This category contains materials that are specifically engineered to withstand environments that would instantly vaporize standard industrial metals. '.repeat(10), // Repeats to create a massive string
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
        name: 'Ti-6Al-4V Grade 5 Billet',
        slug: 'ti-6al-4v-grade-5-billet',
        category: insertedCategories[0]._id,
        shortDescription: 'The "workhorse" of the titanium industry.',
        longDescription: '<p><strong>Ti-6Al-4V</strong> (UNS R56400) is the most widely used titanium alloy. It features good machinability and excellent mechanical properties.</p><ul><li>High strength-to-weight ratio</li><li>Excellent corrosion resistance</li></ul>',
        specs: [
          { key: 'Density', value: '4.43 g/cm³' },
          { key: 'Melting Range', value: '1604 - 1660 °C' }
        ],
        variants: [{ name: 'Standard Billet' }, { name: 'Forged Bar', priceNote: '+15% Premium' }],
        images: [mockImages[0], mockImages[1]],
        featured: true,
        status: 'published'
      },
      // Product 2: EDGE CASE - No Images, No Variants, Draft Status
      {
        name: 'Inconel 718 Experimental Batch',
        slug: 'inconel-718-experimental',
        category: insertedCategories[1]._id,
        shortDescription: 'Beta phase testing alloy.',
        status: 'draft',
        specs: [] // Empty specs
      },
      // Product 3: EDGE CASE - Massive Variants and Specs
      {
        name: 'Custom Woven Carbon Fiber Tubing',
        slug: 'custom-woven-carbon-fiber-tubing',
        category: insertedCategories[2]._id,
        shortDescription: 'Highly customizable structural tubing.',
        longDescription: '<h2>Massive Specification Sheet</h2><p>This product tests the UI limits for tables and sticky sidebars.</p>',
        specs: massiveSpecs,
        variants: massiveVariants,
        images: [mockImages[3]],
        featured: true,
        status: 'published'
      },
      // Product 4: EDGE CASE - Massive Rich Text HTML
      {
        name: 'Hastelloy C-276 Plate',
        slug: 'hastelloy-c-276-plate',
        category: insertedCategories[3]._id,
        shortDescription: 'Extreme corrosion resistance.',
        longDescription: `
          <h2>Technical Overview</h2>
          <p>Hastelloy C-276 is a nickel-molybdenum-chromium superalloy with an addition of tungsten designed to have excellent corrosion resistance in a wide range of severe environments.</p>
          <blockquote>"The standard of industry for severe corrosive environments."</blockquote>
          <h3>Chemical Composition</h3>
          <table border="1">
            <tr><th>Element</th><th>Percentage</th></tr>
            <tr><td>Nickel (Ni)</td><td>Balance</td></tr>
            <tr><td>Molybdenum (Mo)</td><td>15.0 - 17.0</td></tr>
            <tr><td>Chromium (Cr)</td><td>14.5 - 16.5</td></tr>
          </table>
          <p>More paragraphs... </p>
          <p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20)}</p>
        `,
        specs: [{ key: 'UNS', value: 'N10276' }],
        images: [mockImages[2]],
        status: 'published'
      }
    ];

    await Product.insertMany(productsData);

    // 4. BlogPost Seeding
    console.log('Seeding Blog Posts...');
    const blogData = [
      {
        title: 'The Future of Metallurgy in Aerospace',
        slug: 'future-metallurgy-aerospace',
        coverImage: mockImages[1],
        content: `<h2>The Rise of Superalloys</h2><p>As jet engines run hotter, the demand for high-temperature superalloys increases.</p><p>${'This is a very long paragraph detailing thermal dynamics. '.repeat(30)}</p>`,
        excerpt: 'An exploration into the materials defining the next generation of flight.',
        tags: ['Aerospace', 'Superalloys', 'Innovation'],
        status: 'published',
        publishedAt: new Date()
      },
      // EDGE CASE: Massive title, no cover image, no tags, zero excerpt
      {
        title: 'An In-Depth Computational Analysis of Micro-Fractures in Cryogenically Treated Titanium Matrices Over a 10-Year Stress Period Under Variable Loads',
        slug: 'in-depth-computational-analysis-micro-fractures',
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
