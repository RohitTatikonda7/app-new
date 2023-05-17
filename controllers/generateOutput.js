const xlsx = require('node-xlsx');
const fs = require('fs/promises');

async function findTopMostParentJob(jobs, jobId) {
  const job = jobs.find(job => job['Job ID'] === jobId);
  if (!job) {
    return null;
  }

  let parentJobId = job['Parent ID'];
  let workflowName = job['WF Name'];

  while (parentJobId !== 'undefined') {
    const parentJob = jobs.find(job => job['Job ID'] === parentJobId);
    if (!parentJob) {
      return null;
    }
    parentJobId = parentJob['Parent ID'];
    if (parentJobId === 'undefined') {
      return { jobId: parentJob['Job ID'], workflowName: parentJob['WF Name'] };
    }
  }
  return { jobId: jobId, workflowName: workflowName };
}

async function readExcelFile(fileName) {
  try {
    const sheets = xlsx.parse(fileName);
    const sheetData = sheets[0].data;
    const headers = sheetData[0];
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

  for (let i = 0; i < data.length; i++) {
    let currentTopMost = await findTopMostParentJob(data, data[i]['Parent ID']);
    if (currentTopMost != null) {
      data[i]['Topmost Parent JobId'] = currentTopMost['jobId'];
      data[i]['Topmost Parent Workflow Name'] = currentTopMost['workflowName'];
    } else {
      data[i]['Topmost Parent JobId'] = 'NA';
      data[i]['Topmost Parent Workflow Name'] = 'NA';
    }
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(obj => Object.values(obj));
  const sheetData = [headers, ...rows];
  const buffer = xlsx.build([{ name: 'Sheet 1', data: sheetData }]);

  try {
    await fs.writeFile('output1.xlsx', buffer);
    return buffer;
  } catch (error) {
    console.error(error);
  }
}


module.exports = generateOutput