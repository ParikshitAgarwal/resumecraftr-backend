const express = require("express")
const cors = require("cors")
const app = express();
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const {
  timeout
} = require("puppeteer");

require('dotenv').config()
app.use(cors());
app.use(bodyParser.json());

const getChromeLauncherPath = async () => {
  const chromeLauncher = await import('chrome-launcher');
  const launcher = chromeLauncher.default.Launcher.getInstallations()
  return launcher
  console.log(launcher)
}

const doSomePuppeteerThings = async (jsonFormData, id) => {
  //  const chromExecutablePath = await getChromeLauncherPath();
  console.log(process.env.CHROME_EXECUTABLE_PATH)
  let browser = null;
  const url = 'https://www.resumecraftr.in/resume-preview/' + id;
  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '-no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--deterministic-fetch',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath(),
      headless: chromium.headless,
    });
    const localStorage = {
      formData: jsonFormData
    };
    await setDomainLocalStorage(browser, url, localStorage);
    console.log("second")
    const page = await browser.newPage();
    // do your actual puppeteer things now

    await page.goto(url, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 3000,

    });

    const divContent = await page.evaluate(() => {
      const targetDiv = document.querySelector("#previewLayout");

      return targetDiv ? targetDiv.textContent : 'Div not found!';
    });


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
  console.log("first")
  const page = await browser.newPage();
  console.log("first2")

  await page.setRequestInterception(true);
  console.log("first3")

  page.on('request', r => {
    r.respond({
      status: 200,
      contentType: 'text/plain',
      body: 'tweak me.',
    });
  });
  await page.goto(url, {
    waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
    timeout: 3000
  });
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
    // Launch Puppeteer
    // const browser = await puppeteer.launch({headless: false,args: ['--no-sandbox','--disable-setuid-sandbox']
    // });
    // const page = await browser.newPage();
    // console.log("page:",page)
    // console.log("browser:",browser)
    // console.log("formData",formData)
    // console.log(jsonFormData)
    // Set the content of the page
    // await page.setCookie([{'formDataa': jsonFormData}])

    // await page.goto('http://localhost:3000/resume-preview', {
    //     waitUntil: 'load',

    //   });





    // await page.setContent(html, { waitUntil: 'networkidle2' , format: 'A4', printBackground: true});


    // Generate PDF
    // const pdfBuffer = await page.pdf({
    //     printBackground: true
    //   });
    // console.log(pdfBuffer)
    // Close the browser
    // await browser.close();

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