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

// Curated high-resolution industrial photography URLs
const industrialImages = [
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80', // Foundry Sparks
  'https://images.unsplash.com/photo-1565439390118-b229fae1bc9c?auto=format&fit=crop&w=1200&q=80', // Copper Coils
  'https://images.unsplash.com/photo-1605814529321-7299f2a00bf8?auto=format&fit=crop&w=1200&q=80', // Copper Tubing
  'https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=1200&q=80', // CNC Milling
  'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?auto=format&fit=crop&w=1200&q=80', // Molten Pouring
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80', // Heat Sink Tech
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', // Precision Lathe
  'https://images.unsplash.com/photo-1509391366360-120092c73f76?auto=format&fit=crop&w=1200&q=80', // Solar Array / Energy
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', // Metallic Surface
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80'  // High Tech Circuit
];

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
      siteName: 'Smalloys Metallurgical Foundry',
      tagline: 'Precision Copper & Specialty Alloy Castings for Marine, Energy & Aerospace Engineering',
      contactEmail: 'contact@smalloys.com',
      contactPhone: '+91 22 4910 8800',
      address: 'Plot 42, Heavy Industrial Estate, Trans-Thane Creek Area, Navi Mumbai, Maharashtra 400705, India',
      linkedIn: 'https://linkedin.com/company/smalloys-foundry',
      website: 'https://smalloys.com',
      seoTitle: 'Smalloys Metallurgical Foundry | Precision Copper & Bronze Castings',
      seoDescription: 'ISO 9001:2015 certified manufacturer of high-purity copper castings, aluminum bronze components, and marine copper-nickel alloys.'
    });
    console.log('Site Settings seeded.');

    // 2. Seed Admin Credentials
    console.log('Seeding Admin Credentials...');
    const adminEmail = 'admin@smalloys.com';
    const adminPassword = 'smalloys_admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      email: adminEmail,
      passwordHash: hashedPassword
    });
    console.log(`Admin account created: ${adminEmail} / ${adminPassword}`);

    // 3. Seed Categories
    console.log('Seeding Categories...');
    const categoriesData = [
      {
        name: 'Bronze Castings',
        slug: 'bronze-castings',
        description: 'High-strength bronze alloys engineered for heavy-duty industrial pumps, valves, wear plates, and structural components.',
        image: industrialImages[0],
        seoTitle: 'Precision Bronze Castings | Smalloys Foundry',
        seoDescription: 'Explore our catalog of wear-resistant phosphor bronze and tin bronze castings for heavy engineering.'
      },
      {
        name: 'Copper-Nickel Alloys',
        slug: 'copper-nickel-alloys',
        description: '70/30 & 90/10 CuNi seawater corrosion resistant flanges, pipe fittings, and marine hardware.',
        image: industrialImages[1],
        seoTitle: 'Copper-Nickel Seawater Alloys | Smalloys',
        seoDescription: 'Marine-grade CuNi 70/30 and CuNi 90/10 cast components designed for extreme anti-fouling and corrosion resistance.'
      },
      {
        name: 'Aluminum Bronze',
        slug: 'aluminum-bronze',
        description: 'Exceptional mechanical toughness, cavitational resistance, and high load capacity for marine propellers, gears, and subsea bodies.',
        image: industrialImages[4],
        seoTitle: 'Aluminum Bronze Castings (C95400 / C95800) | Smalloys',
        seoDescription: 'High-tensile aluminum bronze components engineered to handle intense mechanical stress and saltwater immersion.'
      },
      {
        name: 'High-Conductivity Copper',
        slug: 'high-conductivity-copper',
        description: 'Electrolytic Tough Pitch (ETP) and Oxygen-Free High-Conductivity (OFHC) pure copper castings for EV cold plates, busbars, and power transmission.',
        image: industrialImages[2],
        seoTitle: 'High-Conductivity Pure Copper Castings | Smalloys',
        seoDescription: '101% IACS pure copper castings tailored for electric vehicles, renewable energy transformers, and power electronics.'
      },
      {
        name: 'Specialty Brass & Lead-Free Alloys',
        slug: 'specialty-brass-and-lead-free-alloys',
        description: 'Eco-compliant lead-free silicon brass, naval brass, and manganese brass castings for municipal water supply and architectural fittings.',
        image: industrialImages[6],
        seoTitle: 'Lead-Free Brass & Silicon Bronze Castings | Smalloys',
        seoDescription: 'RoHS and NSF-61 compliant lead-free silicon brass castings for potable water systems and industrial plumbing.'
      }
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    insertedCategories.forEach(c => { catMap[c.slug] = c._id; });
    console.log(`Seeded ${insertedCategories.length} Categories.`);

    // 4. Seed Products (Comprehensive specs & variants across all edge cases)
    console.log('Seeding Products with rich specifications and variants...');
    const productsData = [
      {
        name: 'C95800 Nickel-Aluminum Bronze Pump Casing',
        slug: 'c95800-nickel-aluminum-bronze-pump-casing',
        category: catMap['aluminum-bronze'],
        shortDescription: 'Subsea pump casing cast in UNS C95800 nickel-aluminum bronze for extreme cavitation resistance in offshore oil & gas rigs.',
        longDescription: '<p>Our C95800 Nickel-Aluminum Bronze Pump Casings are vacuum-die-cast and heat-treated to deliver unparalleled yield strength and resistance to marine bio-fouling. Tested to withstand continuous seawater flow velocities in excess of 4.5 meters per second without erosion.</p><p>Every unit undergoes 100% dye penetrant testing (PT) and hydrostatic pressure testing in accordance with ASTM B148 and ASME Section VIII standards.</p>',
        specs: [
          { key: 'UNS Designation', value: 'UNS C95800 / ASTM B148' },
          { key: 'Tensile Strength', value: '650 MPa (94 ksi)' },
          { key: 'Yield Strength', value: '280 MPa (40 ksi)' },
          { key: 'Elongation', value: '15% in 50mm' },
          { key: 'Hardness', value: '180 HBW' },
          { key: 'Density', value: '7.64 g/cm³' },
          { key: 'Machining Tolerance', value: '±0.02 mm (ISO 2768-m)' },
          { key: 'Inspection Standard', value: 'EN 10204 3.1 Certified / 100% NDT Radiography' }
        ],
        variants: [
          {
            name: 'DN100 (4-inch) / Class 150 PN16 Flanged',
            priceNote: 'Standard Stock — Ships in 3 Business Days',
            images: [industrialImages[4], industrialImages[0]]
          },
          {
            name: 'DN150 (6-inch) / Class 300 PN40 Heavy-Duty',
            priceNote: 'Custom Machined — Lead time 2 Weeks',
            images: [industrialImages[0], industrialImages[6]]
          },
          {
            name: 'DN200 (8-inch) / Subsea Spec (EN 1982 CC333G)',
            priceNote: 'Subsea Rated w/ Monel Trim Options',
            images: [industrialImages[6], industrialImages[3]]
          }
        ],
        images: [industrialImages[4], industrialImages[0], industrialImages[6]],
        featured: true,
        status: 'published',
        seoTitle: 'C95800 Nickel Aluminum Bronze Pump Casing | Smalloys',
        seoDescription: 'Buy heavy-duty C95800 NAB cast pump casings engineered for subsea oil rigs and marine seawater pumps.'
      },
      {
        name: 'C71500 Copper-Nickel (70/30) Weld-Neck Marine Flange',
        slug: 'c71500-copper-nickel-70-30-weld-neck-marine-flange',
        category: catMap['copper-nickel-alloys'],
        shortDescription: 'High-pressure 70/30 CuNi weld neck flange manufactured to ASME B16.5 for naval combat vessels and desalination plants.',
        longDescription: '<p>Smalloys C71500 Copper-Nickel 70/30 flanges provide maximum protection against stress corrosion cracking and pitting in warm tropical seawater applications. The high nickel content ensures superior impingement attack resistance over 90/10 alloys.</p>',
        specs: [
          { key: 'Nominal Composition', value: '70% Copper, 30% Nickel, 0.5% Iron, 0.5% Manganese' },
          { key: 'Pressure Class', value: 'Class 150 to Class 600 (ANSI B16.5)' },
          { key: 'Seawater Velocity Rating', value: 'Up to 4.5 m/s continuous' },
          { key: 'Hydrostatic Test Pressure', value: '60 Bar for 30 minutes' },
          { key: 'Thermal Expansion', value: '16.2 x 10⁻⁶ /°C' }
        ],
        variants: [
          {
            name: '2-inch Sch 40 Weld Neck / Class 300',
            priceNote: 'Pre-machined bevel edges ready for TIG welding',
            images: [industrialImages[1], industrialImages[2]]
          },
          {
            name: '4-inch Sch 80 Heavy Wall / Class 600',
            priceNote: 'Includes full MTR heat code traceability',
            images: [industrialImages[2], industrialImages[3]]
          },
          {
            name: '8-inch Blind Flange w/ Tapped Pressure Port',
            priceNote: 'Custom drilling per DIN 86037 standard',
            images: [industrialImages[1], industrialImages[6]]
          }
        ],
        images: [industrialImages[1], industrialImages[2], industrialImages[3]],
        featured: true,
        status: 'published',
        seoTitle: 'CuNi 70/30 Weld Neck Flange C71500 | Smalloys Foundry',
        seoDescription: 'Naval-grade C71500 70/30 copper-nickel weld neck flanges engineered for extreme marine piping environments.'
      },
      {
        name: 'High-Pressure Cast C11000 ETP Copper EV Thermal Heat Sink',
        slug: 'high-pressure-cast-c11000-etp-copper-ev-thermal-heat-sink',
        category: catMap['high-conductivity-copper'],
        shortDescription: 'Ultra-pure C11000 ETP copper liquid-cooled cold plate w/ high-density pin-fin matrix for EV inverter thermal management.',
        longDescription: '<p>Engineered for hypercar and commercial EV power electronics, this ultra-pure C11000 ETP copper heat sink features die-cast pin-fin geometries optimized via computational fluid dynamics (CFD) for minimum pressure drop and maximum heat dissipation.</p>',
        specs: [
          { key: 'Electrical Conductivity', value: '101.0% IACS Min' },
          { key: 'Thermal Conductivity', value: '391 W/m·K at 20°C' },
          { key: 'Purity Level', value: '99.90% Min Copper' },
          { key: 'Surface Plating', value: 'Electroless Nickel Plating (5-8 µm thickness)' },
          { key: 'Helium Leak Rate', value: '< 1 x 10⁻⁸ mbar·l/s' }
        ],
        variants: [
          {
            name: 'Single-Layer Pin-Fin Matrix (120mm x 80mm x 15mm)',
            priceNote: 'Direct-fit module for standard 400V inverter modules',
            images: [industrialImages[5], industrialImages[9]]
          },
          {
            name: 'Dual-Pass Liquid Cooling Cold Plate (250mm x 180mm x 22mm)',
            priceNote: 'High-flow dual inlet designed for 800V SiC architectures',
            images: [industrialImages[9], industrialImages[7]]
          },
          {
            name: 'Direct-Bond Copper (DBC) Substrate Carrier Baseplate',
            priceNote: 'Lapped surface flatness < 0.005mm',
            images: [industrialImages[5], industrialImages[3]]
          }
        ],
        images: [industrialImages[5], industrialImages[9], industrialImages[7]],
        featured: true,
        status: 'published',
        seoTitle: 'C11000 Pure Copper EV Liquid Cold Plate Heat Sink | Smalloys',
        seoDescription: 'High thermal conductivity C11000 pure copper die-cast heat sinks for electric vehicle inverter and battery cooling.'
      },
      {
        name: 'C95400 Aluminum Bronze Precision Worm Gear Blank',
        slug: 'c95400-aluminum-bronze-precision-worm-gear-blank',
        category: catMap['aluminum-bronze'],
        shortDescription: 'Centrifugally cast C95400 aluminum bronze gear blank designed for heavy-duty speed reducers, winches, and industrial actuators.',
        longDescription: '<p>Smalloys centrifugally cast C95400 blanks offer dense microstructures free from blowholes or inclusions, providing optimal fatigue strength when mating with hardened steel worm screws under high shock loads.</p>',
        specs: [
          { key: 'Alloy Grade', value: 'UNS C95400 / 9C Aluminum Bronze' },
          { key: 'Tensile Strength', value: '585 MPa (85 ksi)' },
          { key: 'Machinability Rating', value: '60% relative to free-cutting brass' },
          { key: 'Heat Treatment', value: 'Quenched & Tempered (Temper T6)' },
          { key: 'Max Operating Temperature', value: '260°C continuous' }
        ],
        variants: [
          {
            name: 'OD 150mm x Bore 40mm x Width 45mm (Rough Machined)',
            priceNote: 'Rough turned with 2mm machining allowance',
            images: [industrialImages[6], industrialImages[3]]
          },
          {
            name: 'OD 300mm x Bore 80mm x Width 70mm (Precision Ground)',
            priceNote: 'Finish ground ID bore w/ ISO H7 tolerance',
            images: [industrialImages[3], industrialImages[8]]
          },
          {
            name: 'OD 450mm Custom Keyed Hub (Finished Gear Blank)',
            priceNote: 'Includes dual keyways per DIN 6885 standard',
            images: [industrialImages[6], industrialImages[0]]
          }
        ],
        images: [industrialImages[6], industrialImages[3], industrialImages[8]],
        featured: false,
        status: 'published',
        seoTitle: 'C95400 Centrifugally Cast Bronze Gear Blanks | Smalloys',
        seoDescription: 'Buy centrifugally cast C95400 aluminum bronze worm gear blanks for high-torque industrial gearboxes.'
      },
      {
        name: 'C87600 Silicon Bronze High-Pressure Valve Body',
        slug: 'c87600-silicon-bronze-high-pressure-valve-body',
        category: catMap['specialty-brass-and-lead-free-alloys'],
        shortDescription: 'Investment cast lead-free C87600 silicon bronze valve body engineered for high-pressure municipal waterworks and fire protection.',
        longDescription: '<p>Cast in environmental lead-free silicon bronze alloy C87600, these valve bodies conform strictly to NSF/ANSI 61 for drinking water safety while retaining mechanical strength matching standard tin bronzes.</p>',
        specs: [
          { key: 'Lead Content', value: '< 0.09% Pb (Lead-Free Compliant)' },
          { key: 'Silicon Content', value: '4.0% - 5.0% Si' },
          { key: 'Pressure Rating', value: 'ANSI Class 600 / PN100' },
          { key: 'Potable Water Compliance', value: 'NSF/ANSI 61 & NSF 372 Certified' },
          { key: 'Hydrostatic Test', value: '150 Bar shell test' }
        ],
        variants: [
          {
            name: '1-inch Threaded NPT End Connections',
            priceNote: 'Female NPT threads per ASME B1.20.1',
            images: [industrialImages[6], industrialImages[2]]
          },
          {
            name: '2-inch Socket Weld End Connections',
            priceNote: 'Socket depth per ASME B16.11',
            images: [industrialImages[2], industrialImages[1]]
          },
          {
            name: '3-inch Raised Face Flanged End Connections',
            priceNote: 'Serrated concentric flange face finish',
            images: [industrialImages[6], industrialImages[0]]
          }
        ],
        images: [industrialImages[6], industrialImages[2], industrialImages[1]],
        featured: false,
        status: 'published',
        seoTitle: 'Lead-Free C87600 Silicon Bronze Valve Body | Smalloys',
        seoDescription: 'NSF 61 compliant lead-free silicon bronze valve body castings for high-pressure water systems.'
      },
      {
        name: 'C10200 Oxygen-Free (OFHC) Heavy-Duty Busbar & Collector Ring',
        slug: 'c10200-oxygen-free-ofhc-heavy-duty-busbar-and-collector-ring',
        category: catMap['high-conductivity-copper'],
        shortDescription: 'C10200 OFHC copper heavy current busbar cast and cold-drawn for hydroelectric generators and arc furnaces.',
        longDescription: '<p>Produced with zero hydrogen embrittlement risk, Smalloys C10200 OFHC copper busbars and slip rings are vacuum melted to guarantee an electrical conductivity exceeding 101.5% IACS even under high thermal cycling.</p>',
        specs: [
          { key: 'Oxygen Content', value: '< 0.001% (10 ppm max)' },
          { key: 'Electrical Conductivity', value: '101.5% IACS Min' },
          { key: 'Hydrogen Embrittlement Test', value: 'Passes ASTM B571 180° Bend Test' },
          { key: 'Temper', value: 'Half Hard (H02)' },
          { key: 'Standard', value: 'ASTM B187 / DIN 1787' }
        ],
        variants: [
          {
            name: '50mm x 10mm Flat Busbar (3 Meter Length)',
            priceNote: 'Edge rounded per DIN 43671',
            images: [industrialImages[2], industrialImages[9]]
          },
          {
            name: '100mm x 12mm Tinned Surface (6 Meter Length)',
            priceNote: 'Electro-tin plated 10µm for tarnish resistance',
            images: [industrialImages[9], industrialImages[5]]
          },
          {
            name: 'Custom L-Shaped Laminated Flexible Connector',
            priceNote: 'Silver brazed contact pads',
            images: [industrialImages[2], industrialImages[7]]
          }
        ],
        images: [industrialImages[2], industrialImages[9], industrialImages[5]],
        featured: false,
        status: 'published',
        seoTitle: 'C10200 OFHC Oxygen Free Copper Busbars | Smalloys',
        seoDescription: 'High-purity C10200 OFHC copper heavy duty busbars and generator slip rings for high-voltage power transmission.'
      },
      {
        name: 'C83600 Leaded Red Brass Bushing & Sleeve Bearing',
        slug: 'c83600-leaded-red-brass-bushing-and-sleeve-bearing',
        category: catMap['bronze-castings'],
        shortDescription: 'Continuous cast 85-5-5-5 leaded red brass sleeve bearing offering smooth self-lubricating properties for general machinery.',
        longDescription: '<p>C83600 (85-5-5-5) is the most popular general-purpose casting alloy, offering excellent machinability, good strength, and natural anti-galling qualities for low-speed sleeve bearings.</p>',
        specs: [
          { key: 'Composition', value: '85% Cu, 5% Sn, 5% Pb, 5% Zn' },
          { key: 'Machinability Rating', value: '84% (Free Machining)' },
          { key: 'Compressive Yield Strength', value: '125 MPa' }
        ],
        variants: [
          {
            name: 'Standard OD 50mm x ID 35mm x Length 100mm',
            priceNote: 'In Stock',
            images: [industrialImages[8], industrialImages[0]]
          },
          {
            name: 'Heavy OD 80mm x ID 60mm x Length 150mm',
            priceNote: 'In Stock',
            images: [industrialImages[0], industrialImages[8]]
          }
        ],
        images: [industrialImages[8], industrialImages[0]],
        featured: false,
        status: 'draft',
        seoTitle: 'C83600 85-5-5-5 Red Brass Bushings | Smalloys',
        seoDescription: 'Continuous cast C83600 red brass sleeve bearings and bushings for general mechanical maintenance.'
      }
    ];

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Seeded ${insertedProducts.length} Products.`);

    // 5. Seed Blog Posts
    console.log('Seeding Blog Posts...');
    const blogData = [
      {
        title: 'Why C95800 Nickel-Aluminum Bronze Outperforms Stainless Steel in Seawater Pumps',
        slug: 'why-c95800-nickel-aluminum-bronze-outperforms-stainless-steel-in-seawater-pumps',
        coverImage: industrialImages[0],
        excerpt: 'An in-depth metallurgical analysis comparing cavitation resistance, bio-fouling protection, and life-cycle costs between C95800 NAB and Super Duplex Stainless Steel.',
        content: `
          <p class="lead font-light text-xl text-gray-600 mb-6">When selecting materials for seawater intake pumps on offshore oil platforms and coastal power plants, engineers frequently debate between Super Duplex Stainless Steel (UNS S32750) and Nickel-Aluminum Bronze (UNS C95800). Here is why C95800 remains the gold standard in marine engineering.</p>
          
          <h2 class="text-2xl font-headline font-semibold text-gray-900 mt-8 mb-4">1. Superior Cavitation Resistance</h2>
          <p class="mb-4 text-gray-600">High-velocity pump impellers suffer from localized pressure drops that create vapor bubbles. When these bubbles collapse near the blade surface, micro-jets inflict severe shock waves. C95800 NAB forms an adherent protective oxide film (Cu2O and Al2O3) that rapidly self-heals under mechanical impact, outperforming passive chromium films on stainless steel.</p>

          <h2 class="text-2xl font-headline font-semibold text-gray-900 mt-8 mb-4">2. Natural Anti-Fouling Properties</h2>
          <p class="mb-4 text-gray-600">Copper ions slowly leach from the NAB matrix at controlled microscopic levels (8-12 µg/cm²/day). This natural toxicity prevents barnacles, mussels, and macro-algae from adhering to internal pump volutes, avoiding flow constriction without requiring chemical biocide dosing.</p>

          <h2 class="text-2xl font-headline font-semibold text-gray-900 mt-8 mb-4">3. Comparative Life-Cycle Costs</h2>
          <table class="min-w-full divide-y divide-black/10 my-6">
            <thead>
              <tr class="bg-gray-50">
                <th class="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Property</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">UNS C95800 NAB</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Super Duplex (25Cr)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5 text-sm">
              <tr>
                <td class="py-3 px-4 font-medium text-gray-900">Seawater Velocity Limit</td>
                <td class="py-3 px-4 text-gray-600">4.5 m/s continuous</td>
                <td class="py-3 px-4 text-gray-600">4.0 m/s continuous</td>
              </tr>
              <tr>
                <td class="py-3 px-4 font-medium text-gray-900">Bio-Fouling Risk</td>
                <td class="py-3 px-4 text-gray-600">Virtually Zero (Self-Cleaning)</td>
                <td class="py-3 px-4 text-gray-600">High (Requires Chlorination)</td>
              </tr>
              <tr>
                <td class="py-3 px-4 font-medium text-gray-900">Weld Repairability</td>
                <td class="py-3 px-4 text-gray-600">Excellent (In-Situ Repairable)</td>
                <td class="py-3 px-4 text-gray-600">Complex (Requires Post-Weld Anneal)</td>
              </tr>
            </tbody>
          </table>
        `,
        tags: ['Metallurgy', 'Marine Engineering', 'C95800', 'Pump Casings', 'Corrosion Control'],
        status: 'published',
        publishedAt: new Date('2026-01-15'),
        seoTitle: 'C95800 NAB vs Stainless Steel Seawater Pumps | Smalloys Blog',
        seoDescription: 'Comparative study on why C95800 nickel aluminum bronze outperforms stainless steel in marine seawater pump applications.'
      },
      {
        title: 'The Role of High-Conductivity C11000 Copper in 800V EV Fast-Charging Architecture',
        slug: 'the-role-of-high-conductivity-c11000-copper-in-800v-ev-fast-charging-architecture',
        coverImage: industrialImages[5],
        excerpt: 'How precision die-cast electrolytic copper cold plates enable 350kW ultra-fast charging without thermal throttling in electric vehicle battery packs.',
        content: `
          <p class="lead font-light text-xl text-gray-600 mb-6">As electric vehicle OEMs transition from 400V to 800V powertrain architectures, thermal management during 350kW DC fast charging has become the primary design bottleneck. High-conductivity C11000 copper castings offer the thermal transfer rates necessary to keep lithium-ion cells below 55°C.</p>
          
          <h2 class="text-2xl font-headline font-semibold text-gray-900 mt-8 mb-4">Thermal Conductivity Comparison</h2>
          <p class="mb-4 text-gray-600">Aluminum 6061-T6 provides a thermal conductivity of approximately 167 W/m·K. In contrast, pure C11000 ETP copper achieves 391 W/m·K—over 130% higher thermal performance. This dramatic difference allows cold plates to be engineered with thinner walls and higher pin-fin densities without causing high coolant pressure drop.</p>
        `,
        tags: ['Electric Vehicles', 'C11000', 'Thermal Management', 'Battery Cooling', 'EV Tech'],
        status: 'published',
        publishedAt: new Date('2026-02-10'),
        seoTitle: 'C11000 Copper in 800V EV Fast Charging | Smalloys Insights',
        seoDescription: 'Learn how high-conductivity C11000 copper cold plates unlock ultra-fast charging in 800V EV battery thermal systems.'
      },
      {
        title: 'Understanding Galvanic Corrosion in Marine Piping: CuNi 90/10 vs 70/30 Selection Guide',
        slug: 'understanding-galvanic-corrosion-in-marine-piping-cuni-90-10-vs-70-30-selection-guide',
        coverImage: industrialImages[1],
        excerpt: 'A practical selection framework for naval architects choosing between C70600 (90/10) and C71500 (70/30) copper-nickel piping systems.',
        content: `
          <p class="lead font-light text-xl text-gray-600 mb-6">Copper-nickel alloys are the backbone of marine seawater piping, fire mains, and condenser systems. Choosing between 90/10 (C70600) and 70/30 (C71500) depends on seawater velocity, operating temperature, and presence of sulfide contaminants.</p>
          
          <h2 class="text-2xl font-headline font-semibold text-gray-900 mt-8 mb-4">When to Specify CuNi 70/30 (C71500)</h2>
          <ul class="list-disc pl-6 mb-4 text-gray-600 space-y-2">
            <li><strong>High Velocity Lines:</strong> Seawater speeds exceeding 3.0 m/s up to 4.5 m/s.</li>
            <li><strong>High Temperature Heat Exchangers:</strong> Operating fluid temperatures above 60°C.</li>
            <li><strong>Polluted Seawater / Harbors:</strong> Enhanced resistance to localized pitting in sulfide-rich stagnant waters.</li>
          </ul>
        `,
        tags: ['Copper Nickel', 'CuNi 70/30', 'Marine Piping', 'Corrosion Guide'],
        status: 'published',
        publishedAt: new Date('2026-03-01'),
        seoTitle: 'CuNi 90/10 vs 70/30 Marine Piping Selection Guide | Smalloys',
        seoDescription: 'Technical selection guide comparing copper-nickel 90/10 and 70/30 alloys for marine seawater piping systems.'
      },
      {
        title: 'ISO 9001:2015 & EN 10204 3.1 Certification Standards in Vacuum Die Casting',
        slug: 'iso-9001-2015-and-en-10204-3-1-certification-standards-in-vacuum-die-casting',
        coverImage: industrialImages[3],
        excerpt: 'Overview of quality assurance documentation, material heat traceability, and non-destructive testing requirements for critical foundry components.',
        content: `
          <p class="lead font-light text-xl text-gray-600 mb-6">Traceability is paramount in mission-critical metallurgical casting. Draft article covering our internal spectrographic laboratory procedures and EN 10204 3.1 material test certificate issuance.</p>
        `,
        tags: ['Quality Assurance', 'ISO 9001', 'Foundry Testing', 'Certificates'],
        status: 'draft',
        publishedAt: null,
        seoTitle: 'ISO 9001 & EN 10204 3.1 Quality Assurance | Smalloys',
        seoDescription: 'Overview of quality control standards and spectrographic material testing at Smalloys Metallurgical Foundry.'
      }
    ];

    const insertedBlogs = await BlogPost.insertMany(blogData);
    console.log(`Seeded ${insertedBlogs.length} Blog Posts.`);

    console.log('----------------------------------------------------');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Admin Email: admin@smalloys.com');
    console.log('Admin Password: smalloys_admin@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
