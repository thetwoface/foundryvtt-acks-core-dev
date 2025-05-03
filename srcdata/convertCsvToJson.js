const inputName = "tampering_chaotic";
const fs = require('fs');

// Read the CSV data
const csvData = fs.readFileSync(inputName+'.csv', 'utf8');
const lines = csvData.split('\n').filter(line => line.trim() !== '' && !line.startsWith('//'));

// Parse CSV and convert to structured JSON
const jsonData = [];
const headers = parseCSVLine(lines[0]);

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length > 0) {
    // Parse the result range into min and max values
    const resultRange = parseResultRange(row[0]);

    const entry = {
      result: row[0],
      min: resultRange.min,
      max: resultRange.max,
      condition_recovery: row[1],
      effects: {}
    };

    // Add effects (columns 3-8 in reverse order because they're labeled 6-1)
    for (let j = 0; j < 6; j++) {
      // j+2 is the index in the row, but the effect number is 6-j
      const effectNumber = 6-j;
      entry.effects[effectNumber] = row[j+2];
    }

    jsonData.push(entry);
  }
}

// Helper function to parse CSV lines with semicolon separator and handle quotes
function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let currentItem = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(currentItem.trim());
      currentItem = '';
    } else {
      currentItem += char;
    }
  }

  // Add the last item
  if (currentItem) {
    result.push(currentItem.trim());
  }

  return result;
}

// Helper function to parse result ranges
function parseResultRange(resultText) {
  // Remove any quotes
  resultText = resultText.replace(/"/g, '');

  // Check for header row
  if (resultText === '1d20+ Modifiers') {
    return { min: null, max: null };
  }

  // Handle single value (e.g. "26")
  if (!resultText.includes('–') && !resultText.includes('-') && !resultText.includes('or')) {
    const value = parseInt(resultText);
    return { min: value, max: value };
  }

  // Handle ranges with dashes (e.g. "1 – 5", "6 - 10")
  if (resultText.includes('–') || resultText.includes('-')) {
    const parts = resultText.replace('–', '-').split('-').map(s => s.trim());
    const min = parseInt(parts[0]);
    const max = parseInt(parts[1]);
    return { min, max };
  }

  // Handle special cases like "-6 or more"
  if (resultText.includes('or more')) {
    const min = parseInt(resultText);
    return { min, max: null }; // null represents infinity/no upper bound
  }

  // Default case (couldn't parse)
  return { min: null, max: null };
}

// Write to JSON file
fs.writeFileSync( inputName + '_enhanced.json', JSON.stringify(jsonData, null, 2));
