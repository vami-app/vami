/**
 * Realistic development seed for Radhey Metal Alloys LLP
 * (non-ferrous sheets / plates / circles / ingots / custom castings).
 *
 * Covers every model with medium volume + edge cases.
 * Publish policy: certificates & unverified accreditation claims stay draft.
 *
 * Run: node scripts/seed.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import Admin from '../models/Admin.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import BlogPost from '../models/BlogPost.js';
import SiteSettings from '../models/SiteSettings.js';
import Lead from '../models/Lead.js';
import Certificate from '../models/Certificate.js';
import Resource from '../models/Resource.js';
import PageContent from '../models/PageContent.js';
import Comparison from '../models/Comparison.js';
import LandingPage from '../models/LandingPage.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env.local');
  process.exit(1);
}

const IMG = {
  copper: '/images/copper_sheets_1785916944432.png',
  brass: '/images/brass_plates_1785916962925.png',
  bronze: '/images/phosphor_bronze_1785916974107.png',
  ingots: '/images/nonferrous_ingots_1785916984591.png',
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function wipe() {
  await Promise.all([
    Admin.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    BlogPost.deleteMany({}),
    SiteSettings.deleteMany({}),
    Lead.deleteMany({}),
    Certificate.deleteMany({}),
    Resource.deleteMany({}),
    PageContent.deleteMany({}),
    Comparison.deleteMany({}),
    LandingPage.deleteMany({}),
  ]);
}

async function seed() {
  try {
    console.log('Connecting…');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));

    console.log('Wiping collections…');
    await wipe();

    // ── Site settings (full singleton + edge empty optional fields left blank) ──
    console.log('Seeding SiteSettings…');
    await SiteSettings.create({
      _id: 'site',
      siteName: 'Radhey Metal Alloys LLP',
      tagline: 'Non-ferrous sheets, plates, circles, ingots & custom castings',
      contactEmail: 'radhemetalalloysllp@gmail.com',
      contactPhone: '+91 9081358107',
      contactPhones: ['+91 9081358107', '+91 8469669699', '+91 8141888799'],
      contactPersons: ['Kevin Shah', 'Arth Joshi', 'Aditya Joshi'],
      whatsappNumber: '+919081358107',
      address: '43, Vardhmaan Nagar, Kalol\nGandhinagar, Gujarat\nIndia - 382721',
      manufacturingAddress: 'Kalol, Gandhinagar District, Gujarat, India',
      mapsQuery: 'Radhey Metal Alloys LLP Kalol Gandhinagar',
      mapsEmbedUrl: '',
      linkedIn: '',
      website: 'https://radheymetalalloysllp.com',
      seoTitle: 'Radhey Metal Alloys LLP | Copper, Brass & Phosphor Bronze Manufacturer',
      seoDescription:
        'Gujarat-based manufacturer of ETP/DHP copper, cartridge & naval brass, phosphor bronze, and foundry ingots. RFQ with drawings welcomed.',
      ogImageUrl: IMG.copper,
      faviconUrl: '/images/logo.png',
      youtubeVideoId: '',
      showProductImagesInList: true,
    });

    // ── Admins: SUPER_ADMIN + EDITOR ──
    console.log('Seeding Admins…');
    const [superAdmin, editor] = await Admin.create([
      {
        email: 'admin@radhemetalalloysllp.com',
        passwordHash: await bcrypt.hash('admin_radhey_pass', 10),
        role: 'SUPER_ADMIN',
        tokenVersion: 0,
        loginAttempts: 0,
        lockUntil: null,
      },
      {
        email: 'editor@radhemetalalloysllp.com',
        passwordHash: await bcrypt.hash('editor_radhey_pass', 10),
        role: 'EDITOR',
        tokenVersion: 0,
        loginAttempts: 0,
        lockUntil: null,
      },
    ]);

    // ── Categories (4 active + 1 empty orphan for edge case) ──
    console.log('Seeding Categories…');
    const categories = await Category.insertMany([
      {
        name: 'Copper Products',
        slug: 'copper-products',
        description:
          'High-conductivity copper sheets, plates and circles for electrical, thermal and fabrication work.',
        image: IMG.copper,
        seoTitle: 'Copper Sheets, Plates & Circles | Radhey Metal Alloys LLP',
        seoDescription: 'ETP C11000 and DHP C12200 copper mill products from Kalol, Gujarat.',
      },
      {
        name: 'Brass Products',
        slug: 'brass-products',
        description:
          'Cartridge, naval and free-cutting brass for stamping, marine and machining applications.',
        image: IMG.brass,
        seoTitle: 'Brass Sheets, Plates & Circles | Radhey Metal Alloys LLP',
        seoDescription: 'C260, C464, C360 and related brass grades in sheet, plate and circle form.',
      },
      {
        name: 'Phosphor Bronze Products',
        slug: 'phosphor-bronze-products',
        description:
          'Wear-resistant phosphor bronze for springs, bushings, bearings and heavy-duty diaphragms.',
        image: IMG.bronze,
        seoTitle: 'Phosphor Bronze Sheets & Plates | Radhey Metal Alloys LLP',
        seoDescription: 'C52100, C54400 and related phosphor bronze mill products.',
      },
      {
        name: 'Foundry Ingots & Castings',
        slug: 'foundry-ingots-castings',
        description:
          'Remelt ingots and custom sand / permanent-mould castings in copper, brass and aluminium alloys.',
        image: IMG.ingots,
        seoTitle: 'Non-Ferrous Ingots & Custom Castings | Radhey Metal Alloys LLP',
        seoDescription: 'Copper, brass and aluminium ingots plus drawing-based custom castings.',
      },
      {
        name: 'Special Alloys (Coming Soon)',
        slug: 'special-alloys',
        description: 'Placeholder category with no products — used to exercise empty catalogue states.',
        image: '',
        seoTitle: 'Special Alloys | Radhey Metal Alloys LLP',
        seoDescription: 'Reserved category for future alloy programmes.',
      },
    ]);
    const cat = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

    // ── Products: full tech / minimal / draft / featured / multi-variant ──
    console.log('Seeding Products…');
    const products = await Product.insertMany([
      // COPPER — full published
      {
        name: 'ETP Copper Sheet & Plate (UNS C11000)',
        slug: 'etp-copper-uns-c11000',
        category: cat['copper-products'],
        shortDescription:
          'Electrolytic Tough Pitch copper for busbars, switchgear and high-conductivity fabrications.',
        longDescription:
          '<p>UNS <strong>C11000</strong> (ETP) copper offers ~100% IACS conductivity when ordered in soft temper. Suitable for busbars, earthing strips, electrical panels and heat-spreaders. Supply includes company TC on request; NABL / UT when specified on the RFQ.</p><p>Circles and custom blanks available from plate stock.</p>',
        specs: [
          { key: 'UNS / ISO designation', value: 'C11000 / Cu-ETP' },
          { key: 'Cu (min)', value: '99.90%' },
          { key: 'Electrical conductivity', value: '~100% IACS (annealed)' },
          { key: 'Typical density', value: '8.89 g/cm³' },
        ],
        variants: [
          { name: 'Soft (O) sheet', priceNote: 'Quote on request', images: [IMG.copper] },
          { name: 'Half-hard (H02) sheet', priceNote: 'Quote on request', images: [IMG.copper] },
          { name: 'Hard (H04) plate', priceNote: 'Quote on request', images: [IMG.copper] },
        ],
        images: [IMG.copper],
        featured: true,
        status: 'published',
        seoTitle: 'ETP Copper C11000 Sheets & Plates | Radhey Metal Alloys',
        seoDescription: 'C11000 ETP copper sheets, plates and circles — RFQ with size and temper.',
        grades: ['C11000', 'Cu-ETP', 'IS Grade ETP'],
        thicknessRange: '0.50 – 50 mm',
        widthRange: 'Up to 1 220 mm (subject to stock)',
        lengthRange: 'Cut-to-length / mill lengths',
        temper: 'O (soft), H02 (½ hard), H04 (hard)',
        surfaceFinish: 'Mill finish; bright / polished on request',
        standards: ['ASTM B152', 'IS 191', 'BS EN 1652'],
        applications: ['Busbars', 'Switchgear', 'Earthing', 'Heat sinks', 'Transformer components'],
        availableForms: ['Sheets', 'Plates', 'Circles', 'Cut blanks'],
        qualityDocs: ['Company TC', 'NABL report (on request)', 'Ultrasonic (on request)'],
      },
      {
        name: 'DHP Copper Sheet & Plate (UNS C12200)',
        slug: 'dhp-copper-uns-c12200',
        category: cat['copper-products'],
        shortDescription:
          'Deoxidised high-phosphorus copper preferred for welding, brazing and heat-exchanger work.',
        longDescription:
          '<p>UNS <strong>C12200</strong> (Cu-DHP) resists hydrogen embrittlement during welding/brazing versus ETP. Common in heat-exchanger plates, plumbing fabrications and welded assemblies.</p>',
        specs: [
          { key: 'UNS designation', value: 'C12200 / Cu-DHP' },
          { key: 'Cu (min)', value: '99.90%' },
          { key: 'Phosphorus', value: '0.015 – 0.040%' },
        ],
        variants: [
          { name: 'Soft sheet', priceNote: 'Quote on request', images: [IMG.copper] },
          { name: 'Plate for fabrication', priceNote: 'Quote on request', images: [IMG.copper] },
        ],
        images: [IMG.copper],
        featured: false,
        status: 'published',
        seoTitle: 'DHP Copper C12200 | Radhey Metal Alloys',
        seoDescription: 'C12200 DHP copper sheets and plates for weldable fabrications.',
        grades: ['C12200', 'Cu-DHP'],
        thicknessRange: '0.80 – 40 mm',
        widthRange: 'Up to 1 220 mm',
        lengthRange: 'Cut-to-length',
        temper: 'O, H02',
        surfaceFinish: 'Mill finish',
        standards: ['ASTM B152', 'BS EN 1652'],
        applications: ['Heat exchangers', 'Welded tanks', 'Brazed assemblies'],
        availableForms: ['Sheets', 'Plates', 'Circles'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Commercial Copper Alloys (4/D, 90/10, 95/05)',
        slug: 'commercial-copper-alloys',
        category: cat['copper-products'],
        shortDescription: 'Workable commercial copper grades for general industrial fabrication.',
        longDescription:
          '<p>Programme covers common commercial designations used in Indian fabrication shops. Confirm exact chemistry on RFQ — grades are matched to drawing / standard callouts.</p>',
        specs: [
          { key: 'Programme grades', value: '4/D, CuNi 90/10, 95/05 copper alloys' },
          { key: 'Supply basis', value: 'As agreed on PO / RFQ' },
        ],
        variants: [{ name: 'As per RFQ', priceNote: 'Quote on request', images: [IMG.copper] }],
        images: [IMG.copper],
        featured: false,
        status: 'published',
        grades: ['Grade 4/D', 'CuNi 90/10', '95/05'],
        thicknessRange: '',
        widthRange: '',
        lengthRange: '',
        temper: '',
        surfaceFinish: '',
        standards: [],
        applications: ['General fabrication'],
        availableForms: ['Sheets', 'Plates', 'Circles'],
        qualityDocs: ['Company TC (on request)'],
      },
      {
        name: 'Copper Circles — Blanking Stock',
        slug: 'copper-circles-blanking',
        category: cat['copper-products'],
        shortDescription: 'Precision copper circles for pressed and spun components.',
        longDescription:
          '<p>Circles blanked from ETP or DHP plate/sheet. Diameter and thickness per RFQ drawing.</p>',
        specs: [{ key: 'Base grades', value: 'C11000 / C12200' }],
        variants: [
          { name: 'Ø 100–300 mm', priceNote: 'Quote on request', images: [IMG.copper] },
          { name: 'Ø 300–600 mm', priceNote: 'Quote on request', images: [IMG.copper] },
        ],
        images: [IMG.copper],
        featured: false,
        status: 'published',
        grades: ['C11000', 'C12200'],
        availableForms: ['Circles'],
        applications: ['Spinnings', 'Pressed parts', 'Gaskets'],
        qualityDocs: ['Company TC'],
      },

      // BRASS
      {
        name: 'Cartridge Brass C260 (70/30)',
        slug: 'c260-cartridge-brass',
        category: cat['brass-products'],
        shortDescription: 'High-ductility 70/30 brass for deep drawing, stamping and complex formed parts.',
        longDescription:
          '<p>UNS <strong>C26000</strong> cartridge brass balances strength and formability. Preferred for deep-drawn shells, architectural stampings and decorative fabrications.</p>',
        specs: [
          { key: 'UNS', value: 'C26000' },
          { key: 'Nominal composition', value: 'Cu 70% / Zn 30%' },
        ],
        variants: [
          { name: 'Soft sheet', priceNote: 'Quote on request', images: [IMG.brass] },
          { name: '½ hard sheet', priceNote: 'Quote on request', images: [IMG.brass] },
        ],
        images: [IMG.brass],
        featured: true,
        status: 'published',
        seoTitle: 'C260 Cartridge Brass Sheets | Radhey Metal Alloys',
        grades: ['C26000', '70/30 Brass', 'Cartridge Brass'],
        thicknessRange: '0.40 – 25 mm',
        widthRange: 'Up to 1 220 mm',
        lengthRange: 'Cut-to-length',
        temper: 'O, H02, H04',
        surfaceFinish: 'Mill / bright',
        standards: ['ASTM B36', 'IS 410'],
        applications: ['Deep drawing', 'Stampings', 'Architectural metalwork'],
        availableForms: ['Sheets', 'Plates', 'Circles'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Naval Brass C464',
        slug: 'c464-naval-brass',
        category: cat['brass-products'],
        shortDescription: 'Tin-bearing naval brass for marine and condenser service.',
        longDescription:
          '<p>UNS <strong>C46400</strong> naval brass (~60Cu-39Zn-1Sn) resists dezincification better than plain yellow brass in seawater-facing hardware and condenser plates.</p>',
        specs: [
          { key: 'UNS', value: 'C46400' },
          { key: 'Tin addition', value: '~0.5–1.0% Sn typical' },
        ],
        variants: [{ name: 'Plate / sheet', priceNote: 'Quote on request', images: [IMG.brass] }],
        images: [IMG.brass],
        featured: false,
        status: 'published',
        grades: ['C46400', 'Naval Brass'],
        thicknessRange: '1.0 – 40 mm',
        standards: ['ASTM B21', 'ASTM B171'],
        applications: ['Marine hardware', 'Condenser plates', 'Pump components'],
        availableForms: ['Sheets', 'Plates'],
        qualityDocs: ['Company TC', 'Ultrasonic (on request)'],
      },
      {
        name: 'Free-Cutting Brass C360',
        slug: 'c360-free-cutting-brass',
        category: cat['brass-products'],
        shortDescription: 'Leaded free-cutting brass for high-speed machining and screw-machine parts.',
        longDescription:
          '<p>UNS <strong>C36000</strong> is the industry workhorse for automatic machining. Confirm leaded-brass acceptability for drinking-water contact before ordering.</p>',
        specs: [{ key: 'UNS', value: 'C36000' }],
        variants: [{ name: 'Plate for machining blanks', priceNote: 'Quote on request', images: [IMG.brass] }],
        images: [IMG.brass],
        featured: false,
        status: 'published',
        grades: ['C36000', 'Free-Cutting Brass'],
        standards: ['ASTM B16', 'ASTM B249'],
        applications: ['Screw-machine parts', 'Valve bodies', 'Fittings'],
        availableForms: ['Sheets', 'Plates', 'Cut blanks'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Structural Brass (CZ112 / C27200)',
        slug: 'bs2875-cz112-c27200',
        category: cat['brass-products'],
        shortDescription: 'Higher-strength yellow brass for structural and engineering plate work.',
        longDescription:
          '<p>Mapped to common callouts <strong>BS CZ112</strong> and <strong>C27200</strong>. Final chemistry confirmed against buyer specification.</p>',
        specs: [{ key: 'Reference grades', value: 'BS2875 CZ112 / UNS C27200' }],
        variants: [{ name: 'Engineering plate', priceNote: 'Quote on request', images: [IMG.brass] }],
        images: [IMG.brass],
        featured: false,
        status: 'published',
        grades: ['CZ112', 'C27200'],
        availableForms: ['Sheets', 'Plates'],
        applications: ['Structural brasswork', 'Engineering fabrications'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Leaded Brass — Virgin Quality Programme',
        slug: 'leaded-brass-virgin',
        category: cat['brass-products'],
        shortDescription: 'Machinable leaded brass supplied from virgin-melt programmes when specified.',
        longDescription:
          '<p>Intended for buyers who require virgin feedstock declarations. Exact Pb/Cu/Zn limits locked on RFQ.</p>',
        specs: [{ key: 'Supply note', value: 'Virgin-quality declaration on request' }],
        variants: [{ name: 'As per RFQ', priceNote: 'Quote on request', images: [IMG.brass] }],
        images: [IMG.brass],
        featured: false,
        status: 'published',
        grades: ['Leaded Brass'],
        availableForms: ['Sheets', 'Plates'],
        qualityDocs: ['Company TC'],
      },

      // PHOSPHOR BRONZE
      {
        name: 'Phosphor Bronze C52100 (Cu-8Sn-P)',
        slug: 'c52100-phosphor-bronze',
        category: cat['phosphor-bronze-products'],
        shortDescription: 'High-tin phosphor bronze for springs, diaphragms and wear strips.',
        longDescription:
          '<p>UNS <strong>C52100</strong> (approx. Cu-8Sn with P deoxidation) delivers high fatigue strength and good corrosion resistance for spring and bearing applications.</p>',
        specs: [
          { key: 'UNS', value: 'C52100' },
          { key: 'Nominal Sn', value: '~7–9%' },
        ],
        variants: [
          { name: 'Spring temper strip/sheet', priceNote: 'Quote on request', images: [IMG.bronze] },
          { name: 'Plate', priceNote: 'Quote on request', images: [IMG.bronze] },
        ],
        images: [IMG.bronze],
        featured: true,
        status: 'published',
        grades: ['C52100', 'PB104 (ref.)'],
        thicknessRange: '0.50 – 20 mm',
        temper: 'H04 / spring tempers as agreed',
        standards: ['ASTM B103'],
        applications: ['Electrical springs', 'Diaphragms', 'Wear strips', 'Bushing blanks'],
        availableForms: ['Sheets', 'Plates'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Phosphor Bronze C54400',
        slug: 'c54400-phosphor-bronze',
        category: cat['phosphor-bronze-products'],
        shortDescription: 'Leaded phosphor bronze balancing strength with improved machinability.',
        longDescription:
          '<p>UNS <strong>C54400</strong> is selected when free-machining characteristics are needed in a phosphor bronze family alloy.</p>',
        specs: [{ key: 'UNS', value: 'C54400' }],
        variants: [{ name: 'Plate / sheet', priceNote: 'Quote on request', images: [IMG.bronze] }],
        images: [IMG.bronze],
        featured: false,
        status: 'published',
        grades: ['C54400'],
        standards: ['ASTM B139'],
        applications: ['Machined bearings', 'Gears', 'Valve parts'],
        availableForms: ['Sheets', 'Plates'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Leaded Red Brass Casting Stock (C83600 / C83800)',
        slug: 'c83600-c83800-red-brass',
        category: cat['phosphor-bronze-products'],
        shortDescription: 'Leaded red brass / bronze stock for fluid-handling cast and machined parts.',
        longDescription:
          '<p>Common callouts <strong>C83600</strong> and <strong>C83800</strong> for valves, fittings and pump components. Confirm pressure-equipment codes on RFQ.</p>',
        specs: [{ key: 'UNS options', value: 'C83600 / C83800' }],
        variants: [{ name: 'Plate / casting blank', priceNote: 'Quote on request', images: [IMG.bronze] }],
        images: [IMG.bronze],
        featured: false,
        status: 'published',
        grades: ['C83600', 'C83800'],
        applications: ['Valves', 'Fittings', 'Pump bodies'],
        availableForms: ['Plates', 'Casting blanks'],
        qualityDocs: ['Company TC'],
      },

      // INGOTS & CASTINGS
      {
        name: 'Copper Ingots & Remelt Blocks',
        slug: 'copper-ingots-castings',
        category: cat['foundry-ingots-castings'],
        shortDescription: 'High-purity copper remelt stock for foundries and casting shops.',
        longDescription:
          '<p>Copper ingots sized for remelt. Chemistry confirmed lot-wise. Custom cast shapes available from pattern / drawing.</p>',
        specs: [
          { key: 'Form', value: 'Ingot / custom casting' },
          { key: 'Base metal', value: 'Copper' },
        ],
        variants: [
          { name: 'Standard remelt ingot', priceNote: 'Quote on request', images: [IMG.ingots] },
          { name: 'Custom casting (drawing-based)', priceNote: 'Quote on request', images: [IMG.ingots] },
        ],
        images: [IMG.ingots],
        featured: true,
        status: 'published',
        grades: ['Cu remelt', 'ETP remelt (as agreed)'],
        availableForms: ['Ingots', 'Custom castings'],
        applications: ['Foundry remelt', 'Electrical castings'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Brass Ingots & Custom Castings',
        slug: 'brass-ingots-castings',
        category: cat['foundry-ingots-castings'],
        shortDescription: 'Brass remelt ingots and sand / permanent-mould castings.',
        longDescription:
          '<p>Uniform brass remelt stock plus drawing-based castings for architectural, marine and industrial parts.</p>',
        specs: [{ key: 'Base metal', value: 'Brass alloys per RFQ' }],
        variants: [{ name: 'Ingot or casting', priceNote: 'Quote on request', images: [IMG.ingots] }],
        images: [IMG.ingots],
        featured: false,
        status: 'published',
        availableForms: ['Ingots', 'Custom castings'],
        applications: ['Remelt', 'Architectural castings', 'Marine fittings'],
        qualityDocs: ['Company TC'],
      },
      {
        name: 'Aluminium Ingots & Castings',
        slug: 'aluminium-ingots-castings',
        category: cat['foundry-ingots-castings'],
        shortDescription: 'Aluminium remelt and lightweight cast components.',
        longDescription:
          '<p>Aluminium programmes for remelt and casting. Alloy designation locked on RFQ (e.g. LM / Al-Si families).</p>',
        specs: [{ key: 'Base metal', value: 'Aluminium alloys per RFQ' }],
        variants: [{ name: 'Ingot or casting', priceNote: 'Quote on request', images: [IMG.ingots] }],
        images: [IMG.ingots],
        featured: false,
        status: 'published',
        availableForms: ['Ingots', 'Custom castings'],
        applications: ['Automotive castings', 'Structural castings'],
        qualityDocs: ['Company TC'],
      },

      // EDGE CASES
      {
        name: 'Custom Casting — Drawing Required (Draft)',
        slug: 'custom-casting-drawing-required',
        category: cat['foundry-ingots-castings'],
        shortDescription: 'Placeholder draft SKU for pattern-based castings pending engineering review.',
        longDescription: '<p>Not public until pattern, alloy and NDT scope are agreed.</p>',
        specs: [],
        variants: [],
        images: [],
        featured: false,
        status: 'draft',
        grades: [],
        availableForms: ['Custom castings'],
      },
      {
        name: 'ETP Copper — Minimal Listing',
        slug: 'etp-copper-minimal-listing',
        category: cat['copper-products'],
        shortDescription: 'Published edge case: only name + short blurb; technical fields intentionally empty (omit-if-empty UI).',
        longDescription: '',
        specs: [],
        variants: [{ name: 'RFQ only', priceNote: 'Quote on request', images: [] }],
        images: [IMG.copper],
        featured: false,
        status: 'published',
        grades: [],
        thicknessRange: '',
        standards: [],
        applications: [],
        availableForms: [],
        qualityDocs: [],
      },
    ]);
    const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

    // ── Blog posts ──
    console.log('Seeding BlogPosts…');
    await BlogPost.insertMany([
      {
        title: 'ETP vs DHP Copper: Choosing the Right Grade for Fabrication',
        slug: 'etp-vs-dhp-copper-fabrication',
        coverImage: IMG.copper,
        excerpt:
          'A practical guide to when C11000 ETP or C12200 DHP is the better call for busbars, weldments and heat exchangers.',
        content:
          '<h2>Conductivity first: ETP (C11000)</h2><p>When electrical conductivity is the primary design driver — busbars, earthing strips, switchgear — ETP copper (UNS C11000) is the usual specification. Soft temper approaches 100% IACS.</p><h2>When welding matters: DHP (C12200)</h2><p>Deoxidised high-phosphorus copper resists hydrogen embrittlement during welding and brazing. Prefer DHP for welded tanks, heat-exchanger plate packs and assemblies that see torch work.</p><h2>What to put on the RFQ</h2><p>Grade (UNS or IS), temper, thickness × width × length or circle diameter, quantity, and whether company TC / NABL / UT are required.</p>',
        tags: ['Copper', 'ETP', 'DHP', 'Engineering'],
        status: 'published',
        publishedAt: daysAgo(12),
        seoTitle: 'ETP vs DHP Copper Guide | Radhey Metal Alloys',
        seoDescription: 'How to choose between C11000 ETP and C12200 DHP for fabrication RFQs.',
      },
      {
        title: 'Naval Brass C464 in Condenser and Marine Service',
        slug: 'naval-brass-c464-marine-service',
        coverImage: IMG.brass,
        excerpt: 'Why tin-bearing naval brass remains a staple for seawater-facing plate and hardware.',
        content:
          '<p>Naval brass (C46400) adds tin to a yellow-brass base, improving resistance to dezincification in marine environments. Condenser plates, pump components and seawater hardware commonly call this grade.</p><p>Send thickness, finish and any ultrasonic testing requirements with your RFQ.</p>',
        tags: ['Brass', 'Marine', 'C464'],
        status: 'published',
        publishedAt: daysAgo(28),
        seoTitle: 'Naval Brass C464 for Marine Plate | Radhey Metal Alloys',
        seoDescription: 'Overview of C464 naval brass for condenser and marine fabrications.',
      },
      {
        title: 'Phosphor Bronze Springs and Wear Parts — Spec Notes',
        slug: 'phosphor-bronze-springs-wear-parts',
        coverImage: IMG.bronze,
        excerpt: 'C52100 and related phosphor bronzes for fatigue-critical spring and bearing blanks.',
        content:
          '<p>High-tin phosphor bronzes such as C52100 are selected for spring temper strip, diaphragms and wear strips. Confirm temper, grain direction and any stress-relief needs on the purchase order.</p>',
        tags: ['Phosphor Bronze', 'Springs'],
        status: 'published',
        publishedAt: daysAgo(45),
        seoTitle: 'Phosphor Bronze for Springs | Radhey Metal Alloys',
        seoDescription: 'Notes on specifying C52100 phosphor bronze for springs and wear parts.',
      },
      {
        title: 'How to Submit a Casting Drawing RFQ',
        slug: 'how-to-submit-casting-drawing-rfq',
        coverImage: IMG.ingots,
        excerpt: 'Checklist for pattern-based custom castings: alloy, NDT, tolerance and delivery.',
        content:
          '<ol><li>Alloy / UNS or IS grade</li><li>2D/3D drawing (PDF, DXF, DWG)</li><li>Estimated annual / lot quantity</li><li>NDT scope (visual, UT, radiography if required)</li><li>Delivery location and Incoterms preference</li></ol>',
        tags: ['Castings', 'RFQ'],
        status: 'published',
        publishedAt: daysAgo(5),
        seoTitle: 'Custom Casting RFQ Checklist | Radhey Metal Alloys',
        seoDescription: 'What to include when requesting a custom non-ferrous casting quote.',
      },
      {
        title: 'Draft: Capacity Expansion Notes (Internal)',
        slug: 'draft-capacity-expansion-notes',
        coverImage: '',
        excerpt: 'Internal draft — do not publish until figures are verified.',
        content: '<p>Placeholder for verified melting / rolling capacity figures. Kept draft intentionally.</p>',
        tags: ['Internal'],
        status: 'draft',
        publishedAt: null,
        seoTitle: '',
        seoDescription: '',
      },
      {
        title: 'Untitled Edge Draft',
        slug: 'untitled-edge-draft',
        excerpt: '',
        content: '<p>Minimal draft post for admin pagination / empty-field testing.</p>',
        tags: [],
        status: 'draft',
        coverImage: '',
        publishedAt: null,
      },
    ]);

    // ── Certificates: draft only (never publish unverified claims) ──
    console.log('Seeding Certificates (draft only)…');
    await Certificate.insertMany([
      {
        title: 'Company Test Certificate — Sample Template',
        description: 'Placeholder TC layout awaiting verified PDF upload.',
        issuedBy: 'Radhey Metal Alloys LLP',
        issuedAt: daysAgo(90),
        fileUrl: '',
        status: 'draft',
        verifiedAt: null,
      },
      {
        title: 'NABL Lab Report — Pending Upload',
        description: 'Do not publish until real NABL report PDF is attached and verifiedAt is set.',
        issuedBy: 'External NABL laboratory (TBD)',
        issuedAt: null,
        fileUrl: '',
        status: 'draft',
        verifiedAt: null,
      },
      {
        title: 'ISO / System Certificate — Not Verified',
        description:
          'Explicitly unpublished. Public quality pages must not claim ISO/AS9100 until RMA verifies.',
        issuedBy: '',
        issuedAt: null,
        fileUrl: '',
        status: 'draft',
        verifiedAt: null,
      },
    ]);

    // ── Resources: all types + draft/published mix ──
    console.log('Seeding Resources…');
    await Resource.insertMany([
      {
        title: 'Product Catalogue (Draft PDF)',
        type: 'catalogue',
        description: 'Full mill-product overview — replace fileUrl with Cloudinary PDF when ready.',
        fileUrl: '',
        category: cat['copper-products'],
        product: null,
        status: 'draft',
      },
      {
        title: 'ETP Copper — Technical Data Sheet (Draft)',
        type: 'tds',
        description: 'C11000 typical properties sheet for buyer engineering packs.',
        fileUrl: '',
        category: cat['copper-products'],
        product: productBySlug['etp-copper-uns-c11000']._id,
        status: 'draft',
      },
      {
        title: 'Company Profile (Draft)',
        type: 'company_profile',
        description: 'Corporate capability overview for procurement portals.',
        fileUrl: '',
        status: 'draft',
      },
      {
        title: 'RFQ Drawing Guidelines',
        type: 'other',
        description: 'Accepted formats: PDF, DWG, DXF, JPG, PNG — max 5 files per RFQ.',
        fileUrl: '/images/logo.png',
        status: 'published',
      },
      {
        title: 'Naval Brass Quick Spec (Published stub)',
        type: 'tds',
        description: 'Short public stub linking buyers to contact RFQ for C464.',
        fileUrl: '/images/brass_plates_1785916962925.png',
        category: cat['brass-products'],
        product: productBySlug['c464-naval-brass']._id,
        status: 'published',
      },
      {
        title: 'Orphan Resource — No Category',
        type: 'other',
        description: 'Edge case: published resource without category/product refs.',
        fileUrl: '',
        status: 'published',
      },
    ]);

    // ── Page content: all keys, mix draft/published ──
    console.log('Seeding PageContent…');
    await PageContent.insertMany([
      {
        key: 'capabilities',
        title: 'Manufacturing Capabilities',
        subtitle: 'Sheets, plates, circles, remelt ingots and drawing-based castings.',
        body: 'Radhey Metal Alloys LLP supplies non-ferrous mill products and foundry work from Kalol, Gujarat. Exact capacity figures are published only after verification.',
        status: 'published',
        sections: [
          {
            title: 'Mill products',
            description: 'Copper, brass and phosphor bronze in sheet, plate and circle form.',
            imageUrl: IMG.copper,
            order: 0,
          },
          {
            title: 'Foundry & remelt',
            description: 'Ingots and custom castings matched to buyer drawings.',
            imageUrl: IMG.ingots,
            order: 1,
          },
          {
            title: 'Documentation',
            description: 'Company TC standard; NABL and ultrasonic testing when specified on RFQ.',
            imageUrl: '',
            order: 2,
          },
        ],
      },
      {
        key: 'quality',
        title: 'Quality & Documentation',
        subtitle: 'Traceable lots. No unverified accreditation claims on this page.',
        body: 'Published quality content focuses on documentation options (TC / NABL / UT) rather than unverified ISO logos. Certificates appear only after admin verification.',
        status: 'published',
        sections: [
          {
            title: 'Company Test Certificate',
            description: 'Lot chemistry and dimensions as applicable to the supply.',
            order: 0,
          },
          {
            title: 'Third-party NABL',
            description: 'Available when called out on the purchase order / RFQ.',
            order: 1,
          },
          {
            title: 'Ultrasonic testing',
            description: 'Plate UT scope agreed case-by-case.',
            order: 2,
          },
        ],
      },
      {
        key: 'industries',
        title: 'Industries We Serve',
        subtitle: 'Electrical, marine, general engineering and foundry remelt buyers.',
        body: '',
        status: 'published',
        sections: [
          { title: 'Electrical & power', description: 'Busbars, switchgear and earthing copper.', order: 0 },
          { title: 'Marine & condensers', description: 'Naval brass plate and related hardware.', order: 1 },
          { title: 'OEM fabrication', description: 'Stampings, deep draws and machined blanks.', order: 2 },
          { title: 'Foundries', description: 'Remelt ingots and casting feedstock.', order: 3 },
        ],
      },
      {
        key: 'why_rma',
        title: 'Why Radhey Metal Alloys',
        subtitle: 'Gujarat-based non-ferrous specialist with RFQ-first quoting.',
        body: 'Direct contact with Kevin Shah, Arth Joshi and Aditya Joshi for technical quotations.',
        status: 'published',
        sections: [
          { title: 'Alloy breadth', description: 'Copper, brass, phosphor bronze and aluminium programmes.', order: 0 },
          { title: 'Form flexibility', description: 'Sheets, plates, circles, ingots and custom castings.', order: 1 },
        ],
      },
      {
        key: 'home_gallery',
        title: 'Factory & Product Gallery',
        subtitle: 'Visuals for homepage — draft until photo set is approved.',
        body: '',
        status: 'draft',
        sections: [
          { title: 'Copper sheets', description: '', imageUrl: IMG.copper, order: 0 },
          { title: 'Brass plates', description: '', imageUrl: IMG.brass, order: 1 },
          { title: 'Phosphor bronze', description: '', imageUrl: IMG.bronze, order: 2 },
          { title: 'Ingots', description: '', imageUrl: IMG.ingots, order: 3 },
        ],
      },
    ]);

    // ── Comparisons ──
    console.log('Seeding Comparisons…');
    await Comparison.insertMany([
      {
        title: 'ETP C11000 vs DHP C12200',
        slug: 'etp-c11000-vs-dhp-c12200',
        description: 'Quick engineering comparison for RFQ grade selection.',
        columnLabels: ['ETP C11000', 'DHP C12200'],
        productIds: [
          productBySlug['etp-copper-uns-c11000']._id,
          productBySlug['dhp-copper-uns-c12200']._id,
        ],
        status: 'published',
        rows: [
          { parameter: 'Primary use', values: ['Electrical conductivity', 'Welded / brazed fabrications'] },
          { parameter: 'Cu (min)', values: ['99.90%', '99.90%'] },
          { parameter: 'Deoxidation', values: ['Tough pitch (oxygen-bearing)', 'Phosphorus deoxidised'] },
          { parameter: 'Weldability', values: ['Limited (embrittlement risk)', 'Good'] },
          { parameter: 'Typical standards', values: ['ASTM B152 / IS 191', 'ASTM B152'] },
        ],
      },
      {
        title: 'C260 vs C464 Brass',
        slug: 'c260-vs-c464-brass',
        description: 'Cartridge brass vs naval brass for forming vs marine service.',
        columnLabels: ['C260 Cartridge', 'C464 Naval'],
        productIds: [
          productBySlug['c260-cartridge-brass']._id,
          productBySlug['c464-naval-brass']._id,
        ],
        status: 'published',
        rows: [
          { parameter: 'Formability', values: ['Excellent deep draw', 'Good'] },
          { parameter: 'Marine resistance', values: ['Limited', 'Improved (Sn bearing)'] },
          { parameter: 'Typical forms', values: ['Sheet / circle', 'Plate / sheet'] },
        ],
      },
      {
        title: 'Draft: C52100 vs C54400',
        slug: 'draft-c52100-vs-c54400',
        description: 'Internal draft comparison — not public.',
        columnLabels: ['C52100', 'C54400'],
        productIds: [],
        status: 'draft',
        rows: [
          { parameter: 'Machinability', values: ['Moderate', 'Improved (leaded)'] },
          { parameter: 'Spring use', values: ['Common', 'Less common'] },
        ],
      },
    ]);

    // ── Geo / application landing pages ──
    console.log('Seeding LandingPages…');
    await LandingPage.insertMany([
      {
        slug: 'copper-sheets-gujarat',
        title: 'Copper Sheets Manufacturer in Gujarat',
        h1: 'Copper sheets & plates from Kalol, Gujarat',
        body: 'ETP and DHP copper mill products for electrical and fabrication buyers across India. Request a quote with size, temper and documentation needs.',
        geo: 'Gujarat',
        relatedProductSlugs: ['etp-copper-uns-c11000', 'dhp-copper-uns-c12200'],
        relatedIndustryKeys: ['electrical', 'fabrication'],
        seoTitle: 'Copper Sheets Gujarat | Radhey Metal Alloys LLP',
        seoDescription: 'Gujarat copper sheet and plate manufacturer — ETP C11000 & DHP C12200 RFQs.',
        status: 'published',
      },
      {
        slug: 'naval-brass-plates-india',
        title: 'Naval Brass Plates — India Supply',
        h1: 'C464 naval brass plates for marine and condenser work',
        body: 'Specify thickness, UT requirements and delivery location on your RFQ.',
        geo: 'India',
        relatedProductSlugs: ['c464-naval-brass'],
        relatedIndustryKeys: ['marine'],
        seoTitle: 'Naval Brass Plates India | Radhey Metal Alloys',
        seoDescription: 'C464 naval brass plate supply from Gujarat.',
        status: 'published',
      },
      {
        slug: 'custom-bronze-castings-ahmedabad',
        title: 'Custom Bronze Castings near Ahmedabad',
        h1: 'Drawing-based bronze & brass castings',
        body: 'Pattern / CAD based castings. Upload drawings on the contact RFQ form.',
        geo: 'Ahmedabad',
        relatedProductSlugs: ['brass-ingots-castings', 'c83600-c83800-red-brass'],
        relatedIndustryKeys: ['foundry'],
        seoTitle: 'Custom Castings Ahmedabad | Radhey Metal Alloys',
        seoDescription: 'Custom non-ferrous castings for Ahmedabad and Gujarat OEMs.',
        status: 'published',
      },
      {
        slug: 'draft-export-landing',
        title: 'Export Landing (Draft)',
        h1: '',
        body: 'Reserved for verified export messaging.',
        geo: '',
        relatedProductSlugs: [],
        relatedIndustryKeys: [],
        seoTitle: '',
        seoDescription: '',
        status: 'draft',
      },
    ]);

    // ── Leads: every status + field edge cases ──
    console.log('Seeding Leads…');
    await Lead.insertMany([
      {
        name: 'Rajesh Patel',
        company: 'Gujarat Power Components Pvt Ltd',
        email: 'procurement@gpc-example.com',
        phone: '+91 9876500001',
        country: 'India',
        product: 'ETP Copper Sheet & Plate (UNS C11000)',
        category: 'Copper',
        materialGrade: 'C11000',
        formFactor: 'Sheets',
        quantity: '2.5 MT',
        dimensions: '3 mm × 1000 mm × 2000 mm',
        requiredStandard: 'ASTM B152',
        deliveryLocation: 'Vadodara, Gujarat',
        additionalRequirements: 'Soft temper preferred. Need company TC with each lot.',
        needsTC: true,
        needsNabl: false,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'new',
        assignedTo: superAdmin._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        name: 'Anita Desai',
        company: 'Marine Condenser Works',
        email: 'a.desai@mcw-example.com',
        phone: '+91 9876500002',
        country: 'India',
        product: 'Naval Brass C464',
        category: 'Brass',
        materialGrade: 'C46400',
        formFactor: 'Plates',
        quantity: '800 kg',
        dimensions: '12 mm × 1200 mm × 2500 mm',
        requiredStandard: 'ASTM B171',
        deliveryLocation: 'Mumbai port CFS',
        additionalRequirements: 'Ultrasonic testing on plates >10 mm.',
        needsTC: true,
        needsNabl: true,
        needsUT: true,
        attachments: [
          {
            url: '/images/brass_plates_1785916962925.png',
            filename: 'plate-layout-sketch.png',
            mimeType: 'image/png',
            bytes: 120000,
          },
        ],
        source: 'contact',
        status: 'reviewing',
        internalNotes: 'Confirm UT scope with shop floor before quote.',
        assignedTo: editor._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(2),
      },
      {
        name: 'Thomas Keller',
        company: 'Keller Electrical GmbH',
        email: 't.keller@keller-electrical.example',
        phone: '+49 30 1234567',
        country: 'Germany',
        product: 'ETP Copper Sheet & Plate (UNS C11000)',
        category: 'Copper',
        materialGrade: 'C11000',
        formFactor: 'Sheets',
        quantity: '1.2 MT',
        dimensions: '2 mm × 600 mm × coil/CTL',
        requiredStandard: 'EN 1652',
        deliveryLocation: 'Hamburg, Germany',
        additionalRequirements: 'Export packing. Mill certificates in English.',
        needsTC: true,
        needsNabl: true,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'quoted',
        quotationNotes: 'Offered soft temper, CIF Hamburg working estimate — pending final freight.',
        quotationValidity: '15 days from quote date',
        quotationFileUrl: '',
        assignedTo: superAdmin._id,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(4),
      },
      {
        name: 'Suresh Kumar',
        company: 'Precision Spring Industries',
        email: 'stores@psi-example.in',
        phone: '+91 9876500003',
        country: 'India',
        product: 'Phosphor Bronze C52100 (Cu-8Sn-P)',
        category: 'Phosphor Bronze',
        materialGrade: 'C52100',
        formFactor: 'Sheets',
        quantity: '300 kg',
        dimensions: '0.8 mm × 300 mm × 1000 mm',
        requiredStandard: 'ASTM B103',
        deliveryLocation: 'Pune, Maharashtra',
        additionalRequirements: 'Spring temper.',
        needsTC: true,
        needsNabl: false,
        needsUT: false,
        attachments: [
          {
            url: '/images/phosphor_bronze_1785916974107.png',
            filename: 'spring-blank.pdf',
            mimeType: 'application/pdf',
            bytes: 45000,
          },
          {
            url: '/images/logo.png',
            filename: 'logo-ref.png',
            mimeType: 'image/png',
            bytes: 8000,
          },
        ],
        source: 'contact',
        status: 'closed',
        internalNotes: 'Order fulfilled last quarter — keep for history.',
        assignedTo: editor._id,
        createdAt: daysAgo(60),
        updatedAt: daysAgo(40),
      },
      {
        name: '',
        company: 'Spam Co',
        email: 'buy-now@spam.example',
        phone: '0000000000',
        country: '',
        product: '',
        category: '',
        materialGrade: '',
        formFactor: '',
        quantity: '',
        dimensions: '',
        requiredStandard: '',
        deliveryLocation: '',
        additionalRequirements: 'CRYPTO OFFER CLICK HERE',
        needsTC: false,
        needsNabl: false,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'spam',
        internalNotes: 'Marked spam — honeypot / content filter.',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        name: 'Fatima Al-Hassan',
        company: 'Gulf Heat Transfer LLC',
        email: 'fatima@ght-example.ae',
        phone: '+971 50 123 4567',
        country: 'United Arab Emirates',
        product: 'DHP Copper Sheet & Plate (UNS C12200)',
        category: 'Copper',
        materialGrade: 'C12200',
        formFactor: 'Plates',
        quantity: '5 MT',
        dimensions: '6 mm × 1000 × 3000',
        requiredStandard: 'ASTM B152',
        deliveryLocation: 'Jebel Ali, UAE',
        additionalRequirements: 'Weldable DHP for exchanger shells.',
        needsTC: true,
        needsNabl: true,
        needsUT: true,
        attachments: [],
        source: 'contact',
        status: 'new',
        createdAt: daysAgo(0),
        updatedAt: daysAgo(0),
      },
      {
        name: 'Vikram Shah',
        company: 'Shah Foundry',
        email: 'vikram@shahfoundry-example.com',
        phone: '+91 8469669699',
        country: 'India',
        product: 'Copper Ingots & Remelt Blocks',
        category: 'Copper',
        materialGrade: 'Cu remelt',
        formFactor: 'Ingots',
        quantity: '10 MT / month',
        dimensions: 'Standard remelt ingot',
        requiredStandard: '',
        deliveryLocation: 'Kalol pickup',
        additionalRequirements: 'Monthly offtake discussion.',
        needsTC: true,
        needsNabl: false,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'reviewing',
        assignedTo: superAdmin._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6),
      },
      {
        name: 'Minimal Lead',
        company: 'Minimal Industries',
        email: 'min@minimal-example.com',
        phone: '+91 9000000000',
        country: 'India',
        product: '',
        category: 'Aluminium',
        materialGrade: '',
        formFactor: 'Custom Castings',
        quantity: '',
        dimensions: '',
        requiredStandard: '',
        deliveryLocation: '',
        additionalRequirements: '',
        needsTC: false,
        needsNabl: false,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'new',
        createdAt: daysAgo(8),
        updatedAt: daysAgo(8),
      },
      {
        name: 'Priya Nair',
        company: 'South India Switchgear',
        email: 'priya.nair@sis-example.com',
        phone: '+91 9876500009',
        country: 'India',
        product: 'ETP Copper Sheet & Plate (UNS C11000)',
        category: 'Copper',
        materialGrade: 'C11000',
        formFactor: 'Circles',
        quantity: '150 pcs',
        dimensions: 'Ø 250 mm × 5 mm',
        requiredStandard: 'IS 191',
        deliveryLocation: 'Coimbatore',
        additionalRequirements: 'Circle blanking from plate.',
        needsTC: true,
        needsNabl: false,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'quoted',
        quotationNotes: 'Quoted per piece + scrap allowance.',
        quotationValidity: '7 days',
        assignedTo: editor._id,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(14),
      },
      {
        name: 'Omar Farouk',
        company: 'Cairo Machining Co',
        email: 'omar@cairo-machining.example',
        phone: '+20 100 123 4567',
        country: 'Egypt',
        product: 'Free-Cutting Brass C360',
        category: 'Brass',
        materialGrade: 'C36000',
        formFactor: 'Plates',
        quantity: '500 kg',
        dimensions: '20 mm plate for machining blanks',
        requiredStandard: 'ASTM B16',
        deliveryLocation: 'Alexandria',
        additionalRequirements: 'Not for potable-water contact.',
        needsTC: true,
        needsNabl: false,
        needsUT: false,
        attachments: [],
        source: 'contact',
        status: 'closed',
        createdAt: daysAgo(90),
        updatedAt: daysAgo(70),
      },
    ]);

    console.log('----------------------------------------------------');
    console.log('SEED COMPLETE');
    console.log('Admins:');
    console.log('  SUPER_ADMIN  admin@radhemetalalloysllp.com / admin_radhey_pass');
    console.log('  EDITOR       editor@radhemetalalloysllp.com / editor_radhey_pass');
    console.log('Counts:');
    console.log(`  Categories ${categories.length} | Products ${products.length}`);
    console.log('  Certificates stay draft (publish policy)');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

seed();
