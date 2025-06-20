const https = require('https');
const { parse } = require('csv-parse/sync');

const spreadsheetId = '1AH7am2weK1vCVz13aZTYZHBXC9UNETvmNlKYXJrdodg';
const gid = '792669080';
const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

(async () => {
  try {
    const csvData = await fetchCSV(url);

    const records = parse(csvData, {
      columns: true,             // Treat first row as header
      skip_empty_lines: true,    // Skip empty rows
      relax_column_count: true,  // Allow uneven rows
      trim: true,                // Remove surrounding whitespace
    });

    console.log(JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Error fetching or parsing CSV:', error);
  }
})();