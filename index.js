const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/scrape", (req, res) => {
  const { url } = req.query;

  // Basic validation: Check if URL is provided
  if (!url) {
    return res.status(400).send("URL is required. Usage: /scrape?url=https://example.com");
  }

  // Call the scraping logic function
  scrapeLogic(res, url);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
