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
  res.render('index',{ errorMessage: '' });
});

app.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.render('index', { errorMessage: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log(req.file.originalname);

    let output = await generateOutput(filePath);
    if (!output) {
      console.log('Invalid file');
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully');
        }
      });
      return res.render('index', { errorMessage: 'File not uploaded properly.' });
    }
    console.log(output)
    // const outputBuffer = await fs.readFile('output.xlsx');
    // const outputData = xlsx.parse(outputBuffer)[0].data.slice(1);
    outputData = xlsx.parse(output)[0].data.slice(1);
    const data = {
      rows: outputData,
      headers: ['Job ID', 'WF Name', 'Description', 'Task ID', 'Parent ID', 'Month', 'Year', 'Topmost Parent Job ID', 'Topmost Parent Workflow Name']
    };
    res.render('results', data);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('File deleted successfully');
      }
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


app.get('/download', (req, res) => {
  const outputData = req.query.outputData;
  const outputBuffer = Buffer.from(outputData, 'base64');
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
  
  res.send(outputBuffer);
});



app.listen(3000, () => {
  console.log('Server started on port 3000');
});
