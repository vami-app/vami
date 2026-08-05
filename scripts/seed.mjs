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
import SiteSettings from '../models/SiteSettings.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const images = {
  copper: '/images/copper_sheets_1785916944432.png',
  brass: '/images/brass_plates_1785916962925.png',
  bronze: '/images/phosphor_bronze_1785916974107.png',
  ingots: '/images/nonferrous_ingots_1785916984591.png'
};

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully.');

    console.log('Wiping all existing database collections...');
    await Admin.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await BlogPost.deleteMany({});
    await SiteSettings.deleteMany({});
    console.log('Database wiped completely.');

    // 1. Seed Site Settings (Singleton)
    console.log('Seeding Site Settings...');
    await SiteSettings.create({
      _id: 'site',
      siteName: 'Radhey Metal Alloys LLP',
      tagline: 'Engineering Excellence in Non-Ferrous Metallurgy & Casting',
      contactEmail: 'radhemetalalloysllp@gmail.com',
      contactPhone: '+91 9081358107',
      address: '43, Vardhmaan Nagar, Kalol, Gandhinagar, Gujarat, India - 382721',
      linkedIn: '',
      website: 'https://radheymetalalloysllp.com',
      seoTitle: 'Radhey Metal Alloys LLP | Non-Ferrous Sheet, Plate & Casting Manufacturer',
      seoDescription: 'Radhey Metal Alloys LLP manufactures NABL certified Copper, Brass & Phosphor Bronze sheets, plates, circles, ingots, and custom castings.'
    });
    console.log('Site Settings seeded.');

    // 2. Seed Admin Credentials
    console.log('Seeding Admin Credentials...');
    const adminEmail = 'admin@radhemetalalloysllp.com';
    const adminPassword = 'admin_radhey_pass';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      email: adminEmail,
      passwordHash: hashedPassword
    });

    // 3. Seed Categories
    console.log('Seeding Categories...');
    const categoriesData = [
      {
        name: 'Copper Products',
        slug: 'copper-products',
        description: 'Engineered for exceptional electrical and thermal conductivity.',
        image: images.copper,
        seoTitle: 'Copper Sheets, Plates & Circles | Radhey Metal Alloys LLP',
        seoDescription: 'High-purity ETP (UNS C11000) and DHP (UNS C12200) copper sheets, plates, and circles.'
      },
      {
        name: 'Brass Products',
        slug: 'brass-products',
        description: 'Balancing superior strength, high corrosion resistance, and excellent machinability.',
        image: images.brass,
        seoTitle: 'Brass Sheets, Plates & Circles | Radhey Metal Alloys LLP',
        seoDescription: 'Cartridge Brass (C260), Naval Brass (C464), and Free-Cutting Brass (C360) products.'
      },
      {
        name: 'Phosphor Bronze Products',
        slug: 'phosphor-bronze-products',
        description: 'Engineered for heavy-duty applications demanding high fatigue limits and extreme wear resistance.',
        image: images.bronze,
        seoTitle: 'Phosphor Bronze Sheets & Plates | Radhey Metal Alloys LLP',
        seoDescription: 'C52100, C5440, and C83600 Phosphor Bronze plates and circles for heavy-duty applications.'
      },
      {
        name: 'Foundry Ingots & Castings',
        slug: 'foundry-ingots-castings',
        description: 'Heavy-duty, certified-purity ingots and custom casting solutions ready for industrial assembly or foundry remelting.',
        image: images.ingots,
        seoTitle: 'Non-Ferrous Foundry Ingots & Castings | Radhey Metal Alloys LLP',
        seoDescription: 'High-purity Copper, Brass, and Aluminium ingots and custom castings.'
      }
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    insertedCategories.forEach(c => { catMap[c.slug] = c._id; });

    // 4. Seed Products
    console.log('Seeding Products...');
    const productsData = [
      // COPPER
      {
        name: 'ETP Copper (UNS C11000)',
        slug: 'etp-copper-uns-c11000',
        category: catMap['copper-products'],
        shortDescription: 'Electrolytic Tough Pitch copper—ideal for busbars, electrical panels, and switchgears.',
        longDescription: '<p>Electrolytic Tough Pitch copper—ideal for busbars, electrical panels, and switchgears. Supplied with Complete Company Test Certificates.</p>',
        specs: [{ key: 'Grade', value: 'ETP (UNS C11000)' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.copper] }],
        images: [images.copper],
        featured: true, status: 'published'
      },
      {
        name: 'DHP Copper (UNS C12200 / Cu-DHP)',
        slug: 'dhp-copper-uns-c12200',
        category: catMap['copper-products'],
        shortDescription: 'Deoxidized High Phosphorus copper—optimized for welding, brazing, and heat exchanger tubing.',
        longDescription: '<p>Deoxidized High Phosphorus copper—optimized for welding, brazing, and heat exchanger tubing.</p>',
        specs: [{ key: 'Grade', value: 'DHP (UNS C12200 / Cu-DHP)' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.copper] }],
        images: [images.copper],
        featured: false, status: 'published'
      },
      {
        name: 'Commercial Copper (Grade 4/D, 90:10, 95:05)',
        slug: 'commercial-copper',
        category: catMap['copper-products'],
        shortDescription: 'Economical, highly workable grades tailored for general industrial fabrication.',
        longDescription: '<p>Economical, highly workable grades tailored for general industrial fabrication. Includes Specialized Alloys: Grade 4/D, 90:10 Copper-Nickel, and 95:05 Copper alloys.</p>',
        specs: [{ key: 'Grade', value: 'Grade 4/D, 90:10, 95:05' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.copper] }],
        images: [images.copper],
        featured: false, status: 'published'
      },

      // BRASS
      {
        name: 'C260 (Cartridge Brass / 70/30 Brass)',
        slug: 'c260-cartridge-brass',
        category: catMap['brass-products'],
        shortDescription: 'Maximum ductility; perfect for deep drawing, stamping, and complex component manufacturing.',
        longDescription: '<p>Maximum ductility; perfect for deep drawing, stamping, and complex component manufacturing.</p>',
        specs: [{ key: 'Grade', value: 'C260 (Cartridge Brass / 70/30 Brass)' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.brass] }],
        images: [images.brass],
        featured: true, status: 'published'
      },
      {
        name: 'C464 (Naval Brass)',
        slug: 'c464-naval-brass',
        category: catMap['brass-products'],
        shortDescription: 'Specially alloyed for high corrosion resistance in marine environments and industrial condenser plates.',
        longDescription: '<p>Specially alloyed for high corrosion resistance in marine environments and industrial condenser plates.</p>',
        specs: [{ key: 'Grade', value: 'C464 (Naval Brass)' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.brass] }],
        images: [images.brass],
        featured: false, status: 'published'
      },
      {
        name: 'C360 (Free-Cutting Brass)',
        slug: 'c360-free-cutting-brass',
        category: catMap['brass-products'],
        shortDescription: 'The golden industry standard for high-speed machining and automatic screw operations.',
        longDescription: '<p>The golden industry standard for high-speed machining and automatic screw operations.</p>',
        specs: [{ key: 'Grade', value: 'C360 (Free-Cutting Brass)' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.brass] }],
        images: [images.brass],
        featured: false, status: 'published'
      },
      {
        name: 'BS2875 CZ112 & C27200',
        slug: 'bs2875-cz112-c27200',
        category: catMap['brass-products'],
        shortDescription: 'High-strength structural brass variants certified for precision British and international engineering projects.',
        longDescription: '<p>High-strength structural brass variants certified for precision British and international engineering projects.</p>',
        specs: [{ key: 'Grade', value: 'BS2875 CZ112 & C27200' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.brass] }],
        images: [images.brass],
        featured: false, status: 'published'
      },
      {
        name: 'Leaded Brass (Virgin Quality)',
        slug: 'leaded-brass-virgin',
        category: catMap['brass-products'],
        shortDescription: 'Premium-grade virgin material ensuring clean cutting, crisp threading, and excellent wear properties.',
        longDescription: '<p>Premium-grade virgin material ensuring clean cutting, crisp threading, and excellent wear properties.</p>',
        specs: [{ key: 'Grade', value: 'Leaded Brass (Virgin Quality)' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.brass] }],
        images: [images.brass],
        featured: false, status: 'published'
      },

      // PHOSPHOR BRONZE
      {
        name: 'C52100 & C5440 Phosphor Bronze',
        slug: 'c52100-c5440-phosphor-bronze',
        category: catMap['phosphor-bronze-products'],
        shortDescription: 'High-strength, spring-hard alloys ideal for electrical springs, heavy-duty diaphragms, and bushings.',
        longDescription: '<p>High-strength, spring-hard alloys ideal for electrical springs, heavy-duty diaphragms, and bushings.</p>',
        specs: [{ key: 'Grade', value: 'C52100 & C5440' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.bronze] }],
        images: [images.bronze],
        featured: true, status: 'published'
      },
      {
        name: 'C53400 Phosphor Bronze',
        slug: 'c53400-phosphor-bronze',
        category: catMap['phosphor-bronze-products'],
        shortDescription: 'Leaded Phosphor Bronze combining high structural strength with superior machinability.',
        longDescription: '<p>Leaded Phosphor Bronze combining high structural strength with superior machinability.</p>',
        specs: [{ key: 'Grade', value: 'C53400' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.bronze] }],
        images: [images.bronze],
        featured: false, status: 'published'
      },
      {
        name: 'C83600 & C83800 Phosphor Bronze',
        slug: 'c83600-c83800-phosphor-bronze',
        category: catMap['phosphor-bronze-products'],
        shortDescription: 'Leaded Red Brass / Bronze alloys featuring exceptional casting properties and long-term fluid-control resistance.',
        longDescription: '<p>Leaded Red Brass / Bronze alloys featuring exceptional casting properties and long-term fluid-control resistance.</p>',
        specs: [{ key: 'Grade', value: 'C83600 & C83800' }, { key: 'Forms', value: 'Sheets, Plates & Circles' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.bronze] }],
        images: [images.bronze],
        featured: false, status: 'published'
      },

      // INGOTS & CASTINGS
      {
        name: 'Copper Ingots & Castings',
        slug: 'copper-ingots-castings',
        category: catMap['foundry-ingots-castings'],
        shortDescription: 'High-purity base metal blocks and cast electrical components for premium alloy production.',
        longDescription: '<p>High-purity base metal blocks and cast electrical components for premium alloy production.</p>',
        specs: [{ key: 'Material', value: 'Copper' }, { key: 'Forms', value: 'Ingots & Custom Castings' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.ingots] }],
        images: [images.ingots],
        featured: true, status: 'published'
      },
      {
        name: 'Brass Ingots & Castings',
        slug: 'brass-ingots-castings',
        category: catMap['foundry-ingots-castings'],
        shortDescription: 'Uniformly mixed alloy billets and custom cast parts for architectural, marine, and industrial applications.',
        longDescription: '<p>Uniformly mixed alloy billets and custom cast parts for architectural, marine, and industrial applications.</p>',
        specs: [{ key: 'Material', value: 'Brass' }, { key: 'Forms', value: 'Ingots & Custom Castings' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.ingots] }],
        images: [images.ingots],
        featured: false, status: 'published'
      },
      {
        name: 'Aluminium Ingots & Castings',
        slug: 'aluminium-ingots-castings',
        category: catMap['foundry-ingots-castings'],
        shortDescription: 'Lightweight, high-fluidity grades for automotive, structural, and precision die-cast components.',
        longDescription: '<p>Lightweight, high-fluidity grades for automotive, structural, and precision die-cast components.</p>',
        specs: [{ key: 'Material', value: 'Aluminium' }, { key: 'Forms', value: 'Ingots & Custom Castings' }],
        variants: [{ name: 'Standard Request', priceNote: 'Quote on Request', images: [images.ingots] }],
        images: [images.ingots],
        featured: false, status: 'published'
      }
    ];

    await Product.insertMany(productsData);

    console.log('----------------------------------------------------');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Admin Email: admin@radhemetalalloysllp.com');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
