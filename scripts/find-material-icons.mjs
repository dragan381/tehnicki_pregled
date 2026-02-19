#!/usr/bin/env node
/**
 * Migration Helper: Material Icons to Icon Component
 *
 * This script helps identify Material Icons usage in your components
 * Run: node scripts/find-material-icons.mjs
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const srcDir = "./src";
const materialIconsRegex = /<span class="material-icons[^"]*">([^<]+)<\/span>/g;

async function findMaterialIcons(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await findMaterialIcons(fullPath, results);
    } else if (entry.name.endsWith(".astro")) {
      const content = await readFile(fullPath, "utf-8");
      const matches = [...content.matchAll(materialIconsRegex)];

      if (matches.length > 0) {
        results.push({
          file: fullPath,
          icons: matches.map((m) => ({
            fullMatch: m[0],
            iconName: m[1].trim(),
            line: content.substring(0, m.index).split("\n").length,
          })),
        });
      }
    }
  }

  return results;
}

console.log("🔍 Scanning for Material Icons usage...\n");

findMaterialIcons(srcDir).then((results) => {
  if (results.length === 0) {
    console.log("✅ No Material Icons found! Migration complete.");
    return;
  }

  console.log(`Found Material Icons in ${results.length} file(s):\n`);

  results.forEach(({ file, icons }) => {
    console.log(`📄 ${file}`);
    icons.forEach(({ iconName, line, fullMatch }) => {
      console.log(`   Line ${line}: "${iconName}"`);
      console.log(`   Old: ${fullMatch}`);
      console.log(`   New: <Icon name="${iconName}" />`);
      console.log("");
    });
  });

  console.log("\n📝 To migrate:");
  console.log(
    '1. Import Icon component: import Icon from "../components/Icon.astro";',
  );
  console.log(
    '2. Replace <span class="material-icons">name</span> with <Icon name="name" />',
  );
  console.log(
    '3. Add size prop if needed: <Icon name="name" size="sm|md|lg|xl" />',
  );
});
