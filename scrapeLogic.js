const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res, url) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  try {
    const page = await browser.newPage();

    // Set a default navigation timeout.
    page.setDefaultNavigationTimeout(30000); 

    // 1. Intercept network requests
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      // 2. Block non-essential resources
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    try {
      // Navigate to the URL. Since we are not loading many resources, 
      // 'domcontentloaded' is a better event to wait for. It fires when the initial
      // HTML document has been completely loaded and parsed, without waiting for
      // stylesheets, images, and subframes to finish loading.
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (error) {
      // Even with optimizations, some pages might be slow.
      if (error.name === 'TimeoutError') {
        console.log(`Navigation timed out for ${url} after 15 seconds. Proceeding to get page content.`);
      } else {
        throw error;
      }
    }

    // Get the full HTML content of the page
    const html = await page.content();
    
    // Set content type to HTML and send the response
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (e) {
    console.error(e);
    res.status(500).send(`Something went wrong while running Puppeteer: ${e.message}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
