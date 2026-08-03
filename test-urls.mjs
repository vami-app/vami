const urls = [
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1565439390118-b229fae1bc9c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1605814529321-7299f2a00bf8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1509391366360-120092c73f76?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580983546522-383792cb0023?auto=format&fit=crop&w=2400&q=80'
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`[${res.status}] ${url.split('?')[0].split('/').pop()}`);
    } catch (e) {
      console.log(`[ERR] ${url}`);
    }
  }
}
check();
