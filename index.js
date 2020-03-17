const scraper = require("./scraper");

(async () => {
  await scraper.init();
  await scraper.scrapeItems("laptopuri");
})();
