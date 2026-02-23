const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;

  for (const ch of text) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === '\n' && !inQuotes) {
      if (current.trim()) rows.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current.trim()) rows.push(current);

  return rows.map(r => parseCSVLine(r));
}

const csvPath = path.join(__dirname, '..', 'list_arabic_2.csv');
const outPath = path.join(__dirname, '..', 'src', 'data', 'words-data.json');

const raw = fs.readFileSync(csvPath, 'utf-8');
const parsed = parseCSV(raw);

const header = parsed[0];
console.log('Header:', header);

const seen = new Set();
const words = [];

for (let i = 1; i < parsed.length; i++) {
  const row = parsed[i];
  if (row.length < 3) continue;

  const ar = row[0].trim();
  const en = row[1].trim();
  const nl = row[2].trim();

  if (!ar) continue;
  if (seen.has(ar)) continue;
  seen.add(ar);

  words.push({ ar, en, nl });
}

fs.writeFileSync(outPath, JSON.stringify(words, null, 0));
console.log(`Wrote ${words.length} words to ${outPath}`);
