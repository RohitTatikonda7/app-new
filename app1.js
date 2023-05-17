const express = require('express');
const multer = require('multer');
const generateOutput = require('./controllers/generateOutput');
const xlsx = require('node-xlsx');
const fs = require('fs').promises;
const ejs = require('ejs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); // specify upload directory

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    await generateOutput(filePath);
    const outputBuffer = await fs.readFile('output1.xlsx');
    console.log(outputBuffer)
    const outputData = xlsx.parse(outputBuffer)[0].data.slice(1);;

    const data = {
      rows: outputData,
      headers: ['Job ID','WF Name','Description','Task ID', 'Parent ID','Month','Year', 'Topmost Parent Job ID', 'Topmost Parent Workflow Name']
    };

    res.render('results', data);
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
