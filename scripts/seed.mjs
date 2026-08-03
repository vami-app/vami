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
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Foundry Sparks
  'https://images.unsplash.com/photo-1565439390118-b229fae1bc9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Copper coils
  'https://images.unsplash.com/photo-1605814529321-7299f2a00bf8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Copper pipes
  'https://images.unsplash.com/photo-1581092335397-9583eb92d232?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // CNC Machining
  'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Molten Metal
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'  // Industrial Tech
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Wiping database collections...');
    await Admin.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('Database wiped.');

    // 1. Admin Seeding
    console.log('Seeding Admin...');
    const adminEmail = 'admin@smalloys.com';
    const adminPassword = 'smalloys_admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      email: adminEmail,
      passwordHash: hashedPassword
    });
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);

    // 2. Category Seeding
    console.log('Seeding Categories...');
    const categoriesData = [
      {
        name: 'Bronze Castings',
        slug: 'bronze-castings',
        description: 'High-strength bronze alloys perfect for industrial pump, valve, and heavy-duty structural components.',
        image: mockImages[0],
        seoTitle: 'Premium Bronze Castings | Smalloys',
        seoDescription: 'Browse our extensive catalog of high-strength, wear-resistant bronze castings for industrial applications.'
      },
      {
        name: 'Copper-Nickel Alloys',
        slug: 'copper-nickel-alloys',
        description: 'Exceptional corrosion resistance for marine hardware, shipbuilding, and heavy-duty piping systems.',
        image: mockImages[1],
        seoTitle: 'Copper-Nickel Marine Alloys | Smalloys',
        seoDescription: 'Discover our top-grade copper-nickel alloys, engineered for ultimate marine corrosion resistance.'
      },
      {
        name: 'Aluminum Bronze',
        slug: 'aluminum-bronze',
        description: 'Superior toughness and resistance to wear, making it ideal for heavily loaded gears, bearings, and landing gear parts.',
        image: mockImages[4],
        seoTitle: 'Aluminum Bronze Components | Smalloys',
        seoDescription: 'High-strength aluminum bronze castings designed for intense mechanical stress environments.'
      },
      {
        name: 'High-Conductivity Copper',
        slug: 'high-conductivity-copper',
        description: 'Extremely pure electrolytic copper castings engineered for maximum electrical and thermal conductivity.',
        image: mockImages[2],
        seoTitle: 'High-Conductivity Copper Parts | Smalloys',
        seoDescription: 'Pure copper components tailored for the electrical, EV, and renewable energy sectors.'
      }
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    
    // 3. Product Seeding
    console.log('Seeding Products...');
    
    const productsData = [
      {
        name: 'C95800 Nickel-Aluminum Bronze Pump Casing',
        slug: 'c95800-nickel-aluminum-bronze-casing',
        category: insertedCategories[0]._id,
        shortDescription: 'The heavy-duty "workhorse" of the marine pump industry.',
        longDescription: '<p><strong>C95800</strong> (Nickel-Aluminum Bronze) is widely used for seawater applications. It features excellent corrosion resistance and superior mechanical properties, making it the premier choice for naval architecture and large-scale water treatment facilities.</p><ul><li>High yield strength and durability</li><li>Excellent marine corrosion resistance</li><li>Outstanding resistance to cavitation and erosion</li></ul>',
        specs: [
          { key: 'Alloy', value: 'C95800 (Ni-Al Bronze)' },
          { key: 'Tensile Strength', value: '585 MPa' },
          { key: 'Yield Strength', value: '240 MPa' },
          { key: 'Elongation', value: '15%' }
        ],
        variants: [
          { name: 'Standard Sand Cast', priceNote: 'Request Quote' },
          { name: 'Precision CNC Machined', priceNote: 'Request Quote' }
        ],
        images: [mockImages[0], mockImages[4]],
        featured: true,
        status: 'published',
        seoTitle: 'C95800 Nickel-Aluminum Bronze Pump Casing | Smalloys',
        seoDescription: 'Premium C95800 Nickel-Aluminum Bronze pump casings designed for high-stress marine and industrial applications.'
      },
      {
        name: 'C71500 Copper-Nickel (70/30) Flange',
        slug: 'c71500-copper-nickel-flange',
        category: insertedCategories[1]._id,
        shortDescription: 'Highly customizable structural marine flange.',
        longDescription: '<p>The <strong>C71500 (70/30 Copper-Nickel)</strong> flange is the industry standard for offshore oil rigs and naval vessels. The addition of 30% nickel provides an incredible defense against seawater corrosion while maintaining excellent formability.</p>',
        specs: [
          { key: 'Alloy', value: 'C71500 (CuNi 70/30)' },
          { key: 'Density', value: '8.94 g/cm³' },
          { key: 'Thermal Conductivity', value: '29 W/m·K' }
        ],
        variants: [
          { name: 'Class 150 Flange', priceNote: 'Volume pricing available' },
          { name: 'Class 300 Flange', priceNote: 'Volume pricing available' }
        ],
        images: [mockImages[1], mockImages[3]],
        featured: true,
        status: 'published',
        seoTitle: 'C71500 Copper-Nickel 70/30 Flange | Smalloys',
        seoDescription: 'Corrosion-resistant C71500 CuNi flanges for marine, offshore, and heavy industrial piping.'
      },
      {
        name: 'High-Pressure Cast Copper EV Heat Sink',
        slug: 'high-pressure-cast-copper-heat-sink',
        category: insertedCategories[3]._id,
        shortDescription: 'Extreme thermal conductivity for electrical systems.',
        longDescription: '<h2>Technical Overview</h2><p>This pure copper heat sink is produced using high-pressure die casting to ensure zero porosity and absolute maximum thermal conductivity for EV systems.</p><p>It is specifically designed for high-voltage power transmission and rapid heat dissipation in tight spatial constraints.</p>',
        specs: [
          { key: 'Material', value: 'Electrolytic Tough Pitch (ETP) Copper' },
          { key: 'Thermal Conductivity', value: '390 W/m·K' },
          { key: 'Electrical Conductivity', value: '100% IACS' }
        ],
        variants: [
          { name: '100mm x 100mm Base', priceNote: 'Contact for MOQ' },
          { name: '200mm x 200mm Base', priceNote: 'Contact for MOQ' }
        ],
        images: [mockImages[2], mockImages[5]],
        featured: false,
        status: 'published',
        seoTitle: 'Pure Copper EV Heat Sinks | Smalloys',
        seoDescription: 'High-conductivity cast copper heat sinks engineered for modern electric vehicles and power electronics.'
      },
      {
        name: 'C95400 Aluminum Bronze Heavy Duty Gear',
        slug: 'c95400-aluminum-bronze-gear',
        category: insertedCategories[2]._id,
        shortDescription: 'Exceptional wear resistance for heavy machinery.',
        longDescription: '<p><strong>C95400 Aluminum Bronze</strong> is the most popular all-purpose aluminum bronze alloy. It provides high yield strength, excellent machinability, and resistance to wear and fatigue.</p><p>Our cast gears are used extensively in heavy earth-moving equipment, landing gears, and industrial gearboxes.</p>',
        specs: [
          { key: 'Alloy', value: 'C95400' },
          { key: 'Tensile Strength', value: '515 MPa' },
          { key: 'Yield Strength', value: '220 MPa' },
          { key: 'Hardness', value: '170 Brinell' }
        ],
        variants: [
          { name: 'Rough Cast', priceNote: 'Standard' },
          { name: 'Fully Machined & Heat Treated', priceNote: 'Premium' }
        ],
        images: [mockImages[4], mockImages[3]],
        featured: true,
        status: 'published'
      },
      {
        name: 'C83600 Red Brass Valve Body',
        slug: 'c83600-red-brass-valve-body',
        category: insertedCategories[0]._id,
        shortDescription: 'Standard commercial bronze for fluid handling.',
        longDescription: '<p>Also known as Ounce Metal or 85-5-5-5, <strong>C83600</strong> is an excellent general-purpose alloy widely used for valves, flanges, and low-pressure pump housings. It offers fantastic machinability and moderate corrosion resistance.</p>',
        specs: [
          { key: 'Alloy', value: 'C83600 (Red Brass)' },
          { key: 'Tensile Strength', value: '255 MPa' },
          { key: 'Machinability Rating', value: '84' }
        ],
        variants: [
          { name: '2-Inch Valve Body', priceNote: 'In Stock' },
          { name: '4-Inch Valve Body', priceNote: 'In Stock' }
        ],
        images: [mockImages[0]],
        featured: false,
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
        coverImage: mockImages[5],
        content: `<h2>The Rise of Copper Rotors</h2><p>As electric vehicles demand higher efficiency, the shift toward high-purity copper casting accelerates. Copper's unmatched electrical and thermal conductivity makes it the ideal material for high-performance traction motors.</p><h3>Overcoming Casting Challenges</h3><p>Historically, casting pure copper has been difficult due to its high melting point and susceptibility to gas porosity. However, new high-pressure die casting techniques have revolutionized the process, allowing foundries to produce complex, defect-free copper components at scale.</p>`,
        excerpt: 'An exploration into the high-conductivity materials and casting techniques defining the next generation of electric vehicles.',
        tags: ['Automotive', 'Copper', 'Innovation'],
        status: 'published',
        publishedAt: new Date(Date.now() - 864000000), // 10 days ago
        seoTitle: 'Future of Copper Die Casting in EVs | Smalloys Blog',
        seoDescription: 'Learn how advanced high-pressure copper die casting is accelerating the electric vehicle revolution.'
      },
      {
        title: 'Understanding Marine Alloy Selection: C95800 vs C71500',
        slug: 'marine-alloy-selection-guide',
        coverImage: mockImages[1],
        content: `<h2>Navigating Marine Environments</h2><p>Selecting the right alloy for seawater applications is critical to preventing galvanic corrosion and catastrophic component failure. Two of the most popular choices are Nickel-Aluminum Bronze (C95800) and Copper-Nickel 70/30 (C71500).</p><h3>When to use C95800</h3><p>Nickel-Aluminum Bronze offers higher mechanical strength and is heavily favored for cast components like propellers and pump casings where cavitation erosion is a major concern.</p><h3>When to use C71500</h3><p>Copper-Nickel provides arguably the best overall resistance to biofouling and uniform corrosion, making it the gold standard for piping systems and heat exchangers.</p>`,
        excerpt: 'A comprehensive guide comparing Nickel-Aluminum Bronze and Copper-Nickel alloys for offshore and naval applications.',
        tags: ['Marine', 'Bronze', 'Engineering'],
        status: 'published',
        publishedAt: new Date(Date.now() - 1728000000), // 20 days ago
        seoTitle: 'C95800 vs C71500: Marine Alloy Guide | Smalloys',
        seoDescription: 'Compare the mechanical and corrosion properties of Nickel-Aluminum Bronze and Copper-Nickel 70/30.'
      },
      {
        title: 'State of the Global Copper Market: Q3 Analysis',
        slug: 'q3-copper-market-analysis',
        coverImage: mockImages[3],
        content: `<h2>Supply Chain Realities</h2><p>The global demand for high-grade copper continues to surge as infrastructure projects and green energy initiatives ramp up worldwide. Foundries are seeing unprecedented demand for raw ingots and precision castings alike.</p><p>This post analyzes the current pricing trends, lead times, and what manufacturers can expect as we head into the fourth quarter.</p>`,
        excerpt: 'Analyzing the macroeconomic factors driving copper prices and foundry lead times this quarter.',
        tags: ['Market', 'Supply Chain', 'Copper'],
        status: 'published',
        publishedAt: new Date(Date.now() - 432000000) // 5 days ago
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
