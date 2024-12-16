const express = require("express")
const cors = require("cors")
const app = express();
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const chromium = require('chrome-aws-lambda');

app.use(cors());
app.use(bodyParser.json());

const doSomePuppeteerThings = async (jsonFormData,id) => {
    const url = 'https://www.resumecraftr.in/resume-preview/'+id;
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });
    const localStorage = { formData: jsonFormData };
    await setDomainLocalStorage(browser, url, localStorage);
  
    const page = await browser.newPage();
    // do your actual puppeteer things now

    await page.goto(url, {
        waitUntil: 'networkidle0',

      });

      const divContent = await page.evaluate(() => {
        const targetDiv = document.querySelector("#previewLayout");

        return targetDiv ? targetDiv.textContent : 'Div not found!';
      });


      const pdfBuffer = await page.pdf({
        printBackground: true,
        format: 'A4'

      });
      await browser.close();
      return pdfBuffer;
  };
  
  const setDomainLocalStorage = async (browser, url, values) => {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', r => {
      r.respond({
        status: 200,
        contentType: 'text/plain',
        body: 'tweak me.',
      });
    });
    await page.goto(url);
    await page.evaluate(values => {
      for (const key in values) {
        localStorage.setItem(key, values[key]);
      }
    }, values);
    await page.close();
  };

app.post("/pdf",async (req,res)=>{
    const { formData= {}, id } = req.body;
    const jsonFormData = JSON.stringify(formData);

    try {
      const pdfBuffer = await doSomePuppeteerThings(jsonFormData,id)
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
        res.status(200).send(Buffer.from(pdfBuffer,'binary'));
      } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
      }
})



app.listen(5000,() => console.log("Server Started"))