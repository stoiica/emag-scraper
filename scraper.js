const puppeteer = require("puppeteer");
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "ecommerce"
});

connection.connect(err => {
  if (!err) {
    console.log("Connected to DB");
  } else {
    console.log(err);
  }
});

const BASE_URL = "https://www.emag.ro/";

const scraper = {
  browser: null,
  page: null,

  init: async () => {
    scraper.browser = await puppeteer.launch({ headless: true });

    scraper.page = await scraper.browser.newPage();
  },

  scrapeItems: async category => {
    await scraper.page.goto(BASE_URL + category, {
      waitUntil: "networkidle2"
    });
    const itemsArray = await scraper.page.$$("#card_grid > div");

    let productCounter = 0;
    for (let i of itemsArray) {
      let product_img_url = await i.$eval("img", el =>
        el.getAttribute("data-src")
      );
      let product_title = await i.$eval("a[data-zone='title'", el =>
        el.getAttribute("title")
      );
      let product_new_price = await i.$eval(
        'p[class="product-new-price"',
        el => el.innerText
      );
      product_new_price = parsePrice(product_new_price);
      let product_old_price = await i.$eval(
        'p[class="product-old-price"',
        el => el.innerText
      );
      // console.log({
      //   product_title,
      //   product_img_url,
      //   product_new_price: product_new_price[0],
      //   product_old_price: parsePrice(product_old_price)[0],
      //   product_currency: product_new_price[1],
      //   product_category: category
      // });
      addProduct({
        product_title,
        product_img_url,
        product_new_price: product_new_price[0],
        product_old_price: parsePrice(product_old_price)[0],
        product_currency: product_new_price[1],
        product_category: category
      });
      productCounter += 1;
      console.log(`Products added ----> ${productCounter}`);
    }
    console.log("Completed");
  }
};

function parsePrice(price) {
  let priceArray = price.split(" ");
  priceArray[0] = [priceArray[0].slice(0, -2), priceArray[0].slice(-2)].join(
    " "
  );
  return priceArray;
}

function addProduct(product) {
  connection.query(
    `insert into product values(NULL, "${product.product_title}", "${product.product_img_url}", "${product.product_new_price}", "${product.product_old_price}", "${product.product_currency}", "${product.product_category}")`
  );
}

module.exports = scraper;
