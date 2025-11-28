import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const TARGET_DIRS = [
  "src/app/[locale]/(admin)",
  "src/app/[locale]/(portal)",
  "src/components/admin",
  "src/components/layout",
];

const JSX_TEXT_REGEX = />((?:[^<>{}]|\{[^}]*\})+?)</g;

type FileEntry = {
  file: string;
  texts: string[];
};

function isTextCandidate(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("{") || trimmed.endsWith("}")) return false;
  if (trimmed.length <= 1) return false;
  // Ignore attribute-like snippets
  if (/[=]/.test(trimmed)) return false;
  return true;
}

function collectTexts(filePath: string): FileEntry | null {
  const absolute = path.join(ROOT, filePath);
  const content = fs.readFileSync(absolute, "utf8");
  const matches = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = JSX_TEXT_REGEX.exec(content))) {
    const text = match[1];
    if (isTextCandidate(text)) {
      matches.add(text.replace(/\s+/g, " ").trim());
    }
  }

  if (matches.size === 0) {
    return null;
  }

  return {
    file: filePath,
    texts: Array.from(matches),
  };
}

function walkDir(dir: string, files: string[] = []) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return files;

  for (const entry of fs.readdirSync(absolute)) {
    const full = path.join(absolute, entry);
    const rel = path.relative(ROOT, full);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walkDir(rel, files);
    } else if (stat.isFile() && full.endsWith(".tsx")) {
      files.push(rel);
    }
  }
  return files;
}

function main() {
  const files = TARGET_DIRS.flatMap((dir) => walkDir(dir));
  const results = files
    .map(collectTexts)
    .filter((entry): entry is FileEntry => Boolean(entry));

  if (results.length === 0) {
    console.log("No hardcoded text candidates found.");
    return;
  }

  console.log("Hardcoded text candidates (review for translation):\n");
  for (const entry of results) {
    console.log(`• ${entry.file}`);
    entry.texts.forEach((text) => console.log(`   - ${text}`));
    console.log("");
  }
}

main();


