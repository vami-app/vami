import fs from 'fs';
import path from 'path';

const directories = ['app', 'components'];

const replacements = {
  'bg-\\[#f9f9f9\\]': 'bg-background',
  'bg-white': 'bg-surface',
  'bg-gray-50': 'bg-surface-muted',
  'bg-gray-100': 'bg-surface-subtle',
  'text-gray-900': 'text-text-primary',
  'text-gray-800': 'text-text-secondary',
  'text-gray-700': 'text-text-secondary',
  'text-gray-600': 'text-text-secondary',
  'text-gray-500': 'text-text-muted',
  'text-gray-400': 'text-text-muted',
  'text-gray-300': 'text-text-muted',
  'bg-gray-200/40': 'bg-surface-muted',
  'border-black/5': 'border-border-subtle',
  'border-black/10': 'border-border-base',
  'border-black/20': 'border-border-base',
  'border-gray-100': 'border-surface-subtle',
  'border-gray-200': 'border-border-subtle',
  'border-gray-300': 'border-border-base',
  'hover:text-black': 'hover:text-text-primary',
  'hover:bg-gray-50': 'hover:bg-surface-muted',
  'hover:bg-gray-100': 'hover:bg-surface-subtle',
  'hover:bg-gray-800': 'hover:opacity-90',
  'bg-black': 'bg-text-primary',
  'text-white': 'text-text-inverse',
  'text-black': 'text-text-primary'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      // Exclude ThemeToggle, ThemeProvider, Navbar, SettingsClient, AdminShell to avoid overwriting our manual work
      if (
        fullPath.includes('ThemeToggle.jsx') || 
        fullPath.includes('ThemeProvider.jsx') || 
        fullPath.includes('Navbar.jsx') || 
        fullPath.includes('SettingsClient.jsx') ||
        fullPath.includes('AdminShell.jsx')
      ) {
        continue;
      }

      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      for (const [key, value] of Object.entries(replacements)) {
        // Use regex with word boundaries to avoid partial matches
        const regex = new RegExp(`(?<=\\s|["'\`])${key}(?=\\s|["'\`])`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    processDirectory(fullPath);
  }
});

console.log('Refactoring complete.');
