/**
 * scripts/migrate-content-to-lexical.mjs
 *
 * ONE-TIME MIGRATION: Converts old blog posts with a plain HTML string in
 * the `content` field to the Lexical triple projection format:
 *   { lexicalState: Object, html: String, plainText: String }
 *
 * Run ONCE before or immediately after deploying the new Lexical editor:
 *   node scripts/migrate-content-to-lexical.mjs
 *
 * Requirements:
 *   npm install jsdom (already a transitive dep via isomorphic-dompurify)
 *   MONGODB_URI env var must be set (can use .env.local)
 *
 * Safety:
 * - Only processes documents where content is a string (old format).
 * - Documents already in the new format (content is object) are skipped.
 * - Sets contentMigrated: true and contentMigratedAt: Date for audit trail.
 * - Creates a minimal Lexical state wrapping the plain text — complex formatting
 *   from old TipTap HTML will be preserved in the html field for display, but
 *   the lexicalState will only contain plain text for re-editing. This is a
 *   known trade-off for the migration. If precise formatting recovery is needed,
 *   use Lexical's importHTMLToState in the browser after loading the post.
 *
 * @example
 *   node scripts/migrate-content-to-lexical.mjs
 *   node scripts/migrate-content-to-lexical.mjs --dry-run  (preview only)
 */

import mongoose from 'mongoose';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

// ── Load env vars from .env.local if available ──────────────────────────────
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
} catch {
  // .env.local not present — rely on environment variables
}

const isDryRun = process.argv.includes('--dry-run');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set.');
  process.exit(1);
}

/**
 * Creates a minimal Lexical JSON state from plain text.
 * This produces a valid Lexical state that can be loaded by the editor,
 * though it will only contain plain text (no formatting recovery).
 *
 * @param {string} plainText
 * @returns {object} Lexical EditorState JSON
 */
function createMinimalLexicalState(plainText) {
  // Split into paragraphs on double newlines or <br><br> patterns
  const paragraphs = plainText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const children = paragraphs.length > 0
    ? paragraphs.map((text) => ({
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      }))
    : [{ children: [], direction: null, format: '', indent: 0, type: 'paragraph', version: 1 }];

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
}

/**
 * Extracts plain text from an HTML string.
 * @param {string} html
 * @returns {string}
 */
function extractPlainText(html) {
  try {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  } catch {
    return '';
  }
}

async function migrate() {
  console.log(`🚀 Starting migration${isDryRun ? ' (DRY RUN — no changes will be written)' : ''}...`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const collection = mongoose.connection.db.collection('blogposts');

  // Find all documents where content is a string (old TipTap HTML format)
  const oldPosts = await collection
    .find({ content: { $type: 'string' } })
    .toArray();

  console.log(`📋 Found ${oldPosts.length} posts to migrate`);

  if (oldPosts.length === 0) {
    console.log('✨ Nothing to migrate. All posts are already in the new format.');
    await mongoose.disconnect();
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const post of oldPosts) {
    try {
      const htmlContent = post.content; // Old field: raw HTML string
      const plainText = extractPlainText(htmlContent);
      const lexicalState = createMinimalLexicalState(plainText);

      const newContent = {
        lexicalState,
        html: htmlContent, // Preserve original HTML for display
        plainText,
      };

      if (isDryRun) {
        console.log(`  [DRY RUN] Would migrate: ${post._id} — "${post.title}" (${plainText.length} chars)`);
      } else {
        await collection.updateOne(
          { _id: post._id },
          {
            $set: {
              content: newContent,
              contentMigrated: true,
              contentMigratedAt: new Date(),
            },
          }
        );
        console.log(`  ✅ Migrated: ${post._id} — "${post.title}"`);
      }

      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed to migrate post ${post._id}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n── Migration Summary ──────────────────────────────────');
  console.log(`  Total found:     ${oldPosts.length}`);
  console.log(`  ✅ Successful:   ${successCount}`);
  if (errorCount > 0) console.log(`  ❌ Errors:       ${errorCount}`);
  if (isDryRun) console.log('\n  ℹ️  DRY RUN — no changes were written to the database');
  console.log('────────────────────────────────────────────────────────');

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB. Migration complete.');
}

migrate().catch((err) => {
  console.error('💥 Migration failed with unexpected error:', err);
  process.exit(1);
});
