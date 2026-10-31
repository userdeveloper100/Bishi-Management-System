// Checks that every static class name used in a .vue template has a rule in the compiled stylesheet.
// Usage: node scripts/check-classes.mjs <compiled.css>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = process.argv[2];
if (!cssPath) {
  console.error('Usage: node scripts/check-classes.mjs <compiled.css>');
  process.exit(2);
}

const css = readFileSync(cssPath, 'utf8');
const defined = new Set([...css.matchAll(/\.([A-Za-z0-9_\\-]+)/g)].map((m) => m[1]));

function vueFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return vueFiles(path);
    return name.endsWith('.vue') ? [path] : [];
  });
}

const missing = new Map();
for (const file of vueFiles('src')) {
  const source = readFileSync(file, 'utf8');
  // Quoted strings inside class attributes, including the ones used in :class bindings.
  for (const match of source.matchAll(/"([^"]*)"|'([^']*)'/g)) {
    const text = match[1] ?? match[2];
    for (const token of text.split(/\s+/)) {
      // Only plain class-like tokens; skip template expressions and prose.
      if (!/^[a-z][a-z0-9-]*$/.test(token) || token === 'text') continue; // 'text' is the input type attribute
      if (!isStyleClass(token)) continue;
      if (!defined.has(token)) {
        const files = missing.get(token) ?? new Set();
        files.add(file);
        missing.set(token, files);
      }
    }
  }
}

// A token is treated as a style class if it matches one of the utility or component prefixes.
function isStyleClass(token) {
  return (
    /^(bg|text|border|stroke|p|px|py|pt|pb|m|mx|my|mt|mb|gap|w|h|min-w|min-h|max-w|top|right|bottom|left|inset|z|fs|fw|tracking|lh|rounded|shadow|divide|space-y|opacity|blur|overflow|position|d|flex|items|justify|shrink|truncate|uppercase|underline|translate|scroll|outline|transition|mx-n|bh|pt-safe)(-|$)/.test(
      token,
    ) ||
    [
      'flex',
      'truncate',
      'uppercase',
      'underline',
      'mx-auto',
      'mt-auto',
      'translate-center',
      'scroll-list',
      'px-5',
      'border',
    ].includes(token)
  );
}

if (missing.size === 0) {
  console.log('All style classes used in templates are defined.');
} else {
  console.log(`${missing.size} class(es) used in templates have no rule:`);
  for (const [token, files] of [...missing].sort()) {
    console.log(`  ${token}  <- ${[...files].map((f) => f.replace(/\\/g, '/')).join(', ')}`);
  }
  process.exitCode = 1;
}
