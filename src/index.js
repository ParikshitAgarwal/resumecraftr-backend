const express = require("express")
const cors = require("cors")
const app = express();
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

require('dotenv').config()
app.use(cors({
  origin:  'https://www.resumecraftr.in'
}));
app.use(bodyParser.json());


const doSomePuppeteerThings = async (jsonFormData, id) => {
  console.log(process.env.CHROME_EXECUTABLE_PATH)
  let browser = null;
  const url = 'https://www.resumecraftr.in/resume-preview/' + id;
  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
      ],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath(),
      headless: chromium.headless,
    });
    const localStorage = {
      formData: jsonFormData
    };
    await setDomainLocalStorage(browser, url, localStorage);
    const page = await browser.newPage();

    await page.goto(url);


    const pdfBuffer = await page.pdf({
      printBackground: true,
      format: 'A4'

    });
    console.log(pdfBuffer)
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.log(error);
    return "error"
  }
};

const setDomainLocalStorage = async (browser, url, values) => {
  const page = await browser.newPage();

  await page.goto(url);
  await page.evaluate(values => {
    for (const key in values) {
      localStorage.setItem(key, values[key]);
    }
  }, values);
  await page.close();
};

app.post("/pdf", async (req, res) => {
  const {
    formData = {}, id
  } = req.body;
  const jsonFormData = JSON.stringify(formData);

  try {
    const pdfBuffer = await doSomePuppeteerThings(jsonFormData, id)

    // Send the PDF as a response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=resume.pdf',
    });
    // console.log("pdf buffer:",pdfBuffer)
    res.status(200).send(Buffer.from(pdfBuffer, 'binary'));
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
})



app.listen(5000, () => console.log("Server Started"))