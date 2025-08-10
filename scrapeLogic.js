const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();

puppeteer.use(StealthPlugin());

const scrapeLogic = async (res, url) => {
  const browser = await puppeteer.launch({
    headless: true,
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

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/115.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    console.log("Opening page, waiting for AWS WAF challenge...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait until challenge container disappears or the real page's body loads
    await page.waitForFunction(
      () => !document.querySelector("#challenge-container") && document.body.innerText.length > 50,
      { timeout: 30000 }
    );

    // Extra delay to ensure scripts finish running
    await page.waitForTimeout(2000);

    const html = await page.content();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);

  } catch (e) {
    console.error(e);
    res.status(500).send(`Error: ${e.message}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
