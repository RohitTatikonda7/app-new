const xlsx = require('node-xlsx');
const fs = require('fs/promises');

async function findTopMostParentJob(jobs, jobId) {
  if(jobId=='undefined'){
    return { jobId: 'NA', workflowName: 'NA' };
  }
  const job = jobs.find(job => job['Job ID'] === jobId);
  if (!job) {
    return { jobId: 'Not Found', workflowName: 'Not Found' };
  }

  let parentJobId = job['Parent ID'];
  let workflowName = job['WF Name'];

  while (parentJobId !== 'undefined') {
    const parentJob = jobs.find(job => job['Job ID'] === parentJobId);
    if (!parentJob) {
      return { jobId: 'Not Found', workflowName: 'Not Found' };
    }
    parentJobId = parentJob['Parent ID'];
    if (parentJobId === 'undefined') {
      return { jobId: parentJob['Job ID'], workflowName: parentJob['WF Name'] };
    }
  }
  return { jobId: job['Job ID'], workflowName: workflowName };
}

async function readExcelFile(fileName) {
  try {
    const sheets = xlsx.parse(fileName);
    const sheetData = sheets[0].data;
    const headers = sheetData[0];
    const requiredHeaders = [
      'Job ID',
      'WF Name',
      'Description',
      'Task ID',
      'Parent ID',
      'Month',
      'Year'
    ];

    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      console.log('Missing headers:', missingHeaders);
      return null;
    }

    const rows = sheetData.slice(1);
    const data = rows
      .filter(row => row.some(cell => cell !== ''))
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    console.log(headers);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}


async function generateOutput(fileName) {
  const data = await readExcelFile(fileName);
  if (!data) {
    return;
  }
  let outdata=[],j=0;
  for (let i = 0; i < data.length; i++) {
    if(!data.some(obj=>obj['Parent ID']===data[i]['Job ID'])){
      let currentTopMost = await findTopMostParentJob(data, data[i]['Parent ID']);
      if (currentTopMost != null) {
        outdata[j]=data[i]
        outdata[j]['Topmost Parent JobId'] = currentTopMost['jobId'];
        outdata[j]['Topmost Parent Workflow Name'] = currentTopMost['workflowName'];
      } else {
        outdata[j]['Topmost Parent JobId'] = 'NA';
        outdata[j]['Topmost Parent Workflow Name'] = 'NA';
      }
      j=j+1
    }
  }

  const headers = Object.keys(outdata[0]);
  const rows = outdata.map(obj => Object.values(obj));
  const sheetData = [headers, ...rows];
  const buffer = xlsx.build([{ name: 'Sheet 1', data: sheetData }]);

  try {
    // await fs.writeFile('output.xlsx', buffer);
    return buffer;
  } catch (error) {
    console.error(error);
    return null
  }
}


module.exports = generateOutput