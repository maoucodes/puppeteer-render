const puppeteer = require("puppeteer");
require("dotenv").config();

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

    // Go to the page and let the AWS WAF challenge run
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for the challenge container to disappear
    await page.waitForFunction(
      () => !document.querySelector("#challenge-container"),
      { timeout: 15000 }
    );

    // Now page should have reloaded after challenge
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });

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
