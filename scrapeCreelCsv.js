// scrapeCreelCsv.js
const axios = require("axios");
const { parse } = require("csv-parse/sync");
const fs = require("fs");

// Full URL to the CSV
const csvUrl =
  "https://wdfw.wa.gov/fishing/reports/creel/puget-annual/export?_format=csv";

async function fetchCreelCsv() {
  try {
    const response = await axios.get(csvUrl);
    const csvText = response.data;

    // Optional: Save to file
    fs.writeFileSync("puget_creel_data.csv", csvText);
    console.log("CSV downloaded and saved.");

    // Parse CSV to JS object
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log("Sample of Parsed rows:", records.slice(0, 3)); // Preview 3 rows

    // Optional: Save parsed JSON
    fs.writeFileSync("creel_data.json", JSON.stringify(records, null, 2));
    console.log("Parsed CSV saved as JSON.");
  } catch (err) {
    console.error("Error fetching CSV:", err.message);
  }
}

fetchCreelCsv();
