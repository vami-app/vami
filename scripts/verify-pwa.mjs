/**
 * scripts/verify-pwa.mjs — Post-build PWA assertion suite
 *
 * Run against a live production build: npm start, then node scripts/verify-pwa.mjs
 * Or with a custom base URL: BASE_URL=https://your-tunnel.ngrok.io node scripts/verify-pwa.mjs
 *
 * Lighthouse dropped its PWA category in v12 — this script is the installability gate.
 * The admin/api precache assertion is a security requirement: never remove it.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed++;
}

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── 1. Manifest ──────────────────────────────────────────────────────────────
console.log('\n1. Web App Manifest (/manifest.webmanifest)');
{
  let manifest;
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/manifest.webmanifest`);
    if (res.status !== 200) {
      fail(`Expected 200, got ${res.status}`);
    } else {
      pass(`Returns 200`);
      const ct = res.headers.get('content-type') || '';
      ct.includes('json')
        ? pass(`Content-Type includes json (${ct})`)
        : fail(`Content-Type should be JSON, got: ${ct}`);

      manifest = await res.json();

      const required = ['name', 'short_name', 'start_url', 'display', 'icons', 'id'];
      for (const field of required) {
        manifest[field]
          ? pass(`Has required field: ${field}`)
          : fail(`Missing required field: ${field}`);
      }

      if (manifest.id && !manifest.id.includes('smalloys.com')) {
        pass(`id does not contain wrong domain (smalloys.com)`);
      } else if (manifest.id?.includes('smalloys.com')) {
        fail(`id still contains wrong domain: ${manifest.id}`);
      }
    }
  } catch (err) {
    fail(`Manifest fetch failed: ${err.message}`);
  }

  // ── 2. Icons ────────────────────────────────────────────────────────────────
  console.log('\n2. Manifest Icons');
  if (manifest?.icons) {
    for (const icon of manifest.icons) {
      try {
        const res = await fetchWithTimeout(`${BASE_URL}${icon.src}`);
        if (res.status === 200) {
          const ct = res.headers.get('content-type') || '';
          ct.includes('image')
            ? pass(`${icon.src} → 200 (${ct})`)
            : fail(`${icon.src} → 200 but wrong Content-Type: ${ct}`);
        } else {
          fail(`${icon.src} → ${res.status}`);
        }
      } catch (err) {
        fail(`${icon.src} fetch failed: ${err.message}`);
      }
    }
  } else {
    fail('No icons found in manifest');
  }
}

// ── 3. Service Worker ────────────────────────────────────────────────────────
console.log('\n3. Service Worker (/sw.js)');
{
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/sw.js`);
    if (res.status !== 200) {
      fail(`Expected 200, got ${res.status}`);
    } else {
      pass(`Returns 200`);

      const ct = res.headers.get('content-type') || '';
      ct.includes('javascript')
        ? pass(`Content-Type is javascript (${ct})`)
        : fail(`Expected javascript Content-Type, got: ${ct}`);

      const cc = res.headers.get('cache-control') || '';
      cc.includes('must-revalidate')
        ? pass(`Cache-Control includes must-revalidate (${cc})`)
        : fail(`Cache-Control should include must-revalidate, got: ${cc}`);

      const swa = res.headers.get('service-worker-allowed') || '';
      swa === '/'
        ? pass(`Service-Worker-Allowed: /`)
        : fail(`Expected Service-Worker-Allowed: /, got: ${swa}`);

      // ── 4. Precache manifest security assertion ────────────────────────────
      console.log('\n4. Precache Manifest Security Assertion');
      const swText = await res.text();

      // Serwist injects self.__SW_MANIFEST = [...] into the compiled sw.js
      const manifestMatch = swText.match(/self\.__SW_MANIFEST\s*=\s*(\[.*?\])/s);
      if (!manifestMatch) {
        fail('Could not find self.__SW_MANIFEST in sw.js — was serwist build run after next build?');
      } else {
        let precache;
        try {
          precache = JSON.parse(manifestMatch[1]);
        } catch {
          fail('Could not parse self.__SW_MANIFEST as JSON');
          precache = [];
        }

        const adminEntries = precache.filter(
          (e) => (e.url || e).toString().includes('/admin')
        );
        const apiEntries = precache.filter(
          (e) => (e.url || e).toString().includes('/api')
        );
        const offlineEntry = precache.find(
          (e) => (e.url || e).toString() === '/offline'
        );

        adminEntries.length === 0
          ? pass(`Zero /admin entries in precache manifest ✓ (security)`)
          : fail(`SECURITY: ${adminEntries.length} /admin entries found in precache: ${JSON.stringify(adminEntries)}`);

        apiEntries.length === 0
          ? pass(`Zero /api entries in precache manifest ✓ (security)`)
          : fail(`SECURITY: ${apiEntries.length} /api entries found in precache: ${JSON.stringify(apiEntries)}`);

        offlineEntry
          ? pass(`/offline is in precache manifest`)
          : fail(`/offline is NOT in precache manifest`);

        pass(`Total precache entries: ${precache.length}`);
      }
    }
  } catch (err) {
    fail(`/sw.js fetch failed: ${err.message}`);
  }
}

// ── 5. Offline page ──────────────────────────────────────────────────────────
console.log('\n5. Offline Fallback Page (/offline)');
{
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/offline`);
    res.status === 200
      ? pass(`/offline returns 200`)
      : fail(`Expected 200, got ${res.status}`);
  } catch (err) {
    fail(`/offline fetch failed: ${err.message}`);
  }
}

// ── 6. Domain check ──────────────────────────────────────────────────────────
console.log('\n6. Domain Correctness');
{
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/robots.txt`);
    const text = await res.text();
    text.includes('smalloys.com')
      ? fail('robots.txt still references smalloys.com — fix the domain fallback')
      : pass('robots.txt does not reference smalloys.com');
    const url = new URL(BASE_URL);
    const expectedDomain = url.hostname;
    text.includes(expectedDomain) || text.includes('radheymetalalloysllp.com')
      ? pass(`robots.txt references the correct domain`)
      : fail(`robots.txt does not reference the canonical domain (${expectedDomain})`);
    text.includes('/offline')
      ? pass('robots.txt disallows /offline')
      : fail('/offline is not in robots.txt disallow list');
  } catch (err) {
    fail(`robots.txt fetch failed: ${err.message}`);
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n⚠  PWA verification FAILED. Fix the issues above before deploying.');
  process.exit(1);
} else {
  console.log('\n✓ All PWA verification checks passed!');
}
