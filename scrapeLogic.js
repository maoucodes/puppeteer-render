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

    // Navigate to the provided URL and wait for the network to be idle
    await page.goto(url, { waitUntil: "networkidle2" });

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
