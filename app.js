const express = require('express');
const multer = require('multer');
const generateOutput = require('./controllers/generateOutput');
const xlsx = require('node-xlsx');
const fs = require('fs').promises;

const app = express();
const upload = multer({ dest: 'uploads/' }); // specify upload directory

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>XLSX File Uploader</title>
      </head>
      <body>
        <h1>XLSX File Uploader</h1>
        <form action="/upload" method="post" enctype="multipart/form-data">
          <label for="file">Select an XLSX file to upload:</label>
          <input type="file" id="file" name="file" accept=".xlsx">
          <br>
          <input type="submit" value="Upload">
        </form>
      </body>
    </html>
  `);
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    await generateOutput(filePath);
    const outputBuffer = await fs.readFile('output1.xlsx');
    console.log(outputBuffer)
    const outputData = xlsx.parse(outputBuffer)[0].data.slice(1);;

    const tableRows = outputData.map(row => {
      return `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td><td>${row[6]}</td><td>${row[7]}</td><td>${row[8]}</td><td>${row[9]}</td></tr>`;
    }).join('');

    const html = `
      <html>
        <head>
          <title>XLSX File Upload Results</title>
        </head>
        <body>
          <h1>XLSX File Upload Results</h1>
          <p><a href="/download">Download output file</a></p>
          <table>
            <thead>
              <tr><th>Job ID</th><th>Parent ID</th><th>Topmost Parent Job ID</th><th>Topmost Parent Workflow Name</th></tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get('/download', (req, res) => {
  res.download('output1.xlsx');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
