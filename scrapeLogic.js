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

    // Go to the page (start challenge)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for challenge container to disappear OR timeout
    await page.waitForFunction(
      () => !document.querySelector("#challenge-container"),
      { timeout: 20000 }
    ).catch(() => console.log("Challenge container still present, continuing anyway"));

    // Give AWS WAF some extra time to reload the real page
    await page.waitForTimeout(5000);

    // Now get the HTML (real page or partially loaded)
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
