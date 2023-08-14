const puppeteer = require("puppeteer");
require("dotenv").config();
const login = require("./login.js");
const scrollPage = require("./scrollPage.js");
const extractEmailsFromPost = require("./extractEmailsFromPost.js");
const sendEmails = require("./sendEmails");

const feedUrl = "https://www.linkedin.com/feed/";

(async () => {
  const browser = await puppeteer.launch({
    args: ["--start-maximized"],
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await login(page);

  await page.goto(feedUrl);
  await scrollPage(page, 50);

  const posts = await page.$$("div.feed-shared-update-v2");

  let emailsToSend = [];

  for (const post of posts) {
    const emails = await extractEmailsFromPost(post, page);
    if (emails?.length > 0) {
      emailsToSend.push(...emails);
    }
  }

  if (emailsToSend.length > 0) {
    await sendEmails(emailsToSend);
  }
  await browser.close();
})();
