const fs = require('fs');
const path = require('path');

/**
 * Packs all JSON files in a source directory into a single JSON file,
 * with the filename as object name, content in a "results" field,
 * and an empty "description" field
 * @param {string} sourceDir - Directory containing the JSON files to pack
 * @param {string} outputFile - Path for the output JSON file
 */
function packJsonFiles(sourceDir, outputFile) {
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory ${sourceDir} does not exist`);
    return;
  }

  // Read all files in the directory
  const files = fs.readdirSync(sourceDir);

  // Filter for JSON files
  const jsonFiles = files.filter(file => file.toLowerCase().endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.warn(`No JSON files found in ${sourceDir}`);
    return;
  }

  // Create the result object
  const result = {};

  // Process each JSON file
  jsonFiles.forEach(file => {
    try {
      const filePath = path.join(sourceDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonContent = JSON.parse(fileContent);

      // Use filename without extension as key
      const key = path.basename(file, '.json');

      // Create the new structure with description and results fields
      result[key] = {
        description: "",
        results: jsonContent
      };

      console.log(`Packed: ${file}`);
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  });

  // Write the combined result to the output file
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`Successfully packed ${jsonFiles.length} JSON files into ${outputFile}`);
}

// Example usage
const sourceDirectory = process.argv[2] || __dirname;
const outputFilePath = process.argv[3] || path.join(__dirname, '../public/systems/acks/packs/data.json');

// Create directories if they don't exist
const outputDir = path.dirname(outputFilePath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

packJsonFiles(sourceDirectory, outputFilePath);