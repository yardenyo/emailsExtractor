const puppeteer = require("puppeteer");
require("dotenv").config();
const login = require("./login.js");
const scrollPage = require("./scrollPage.js");
const extractEmailsFromPost = require("./extractEmailsFromPost.js");
const sendEmails = require("./sendEmails");

const feedUrl = "https://www.linkedin.com/feed/";

let browser;

async function runLinkedInEmailSender(formData) {
  browser = await puppeteer.launch({
    args: ["--start-maximized"],
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const linkedinEmail = formData.linkedinEmail;
  const linkedinPassword = formData.linkedinPassword;
  const gmailEmail = formData.gmailEmail;
  const gmailPassword = formData.gmailPassword;
  const cvName = formData.cvName;
  const cvPath = formData.cvPath;
  const scrolls = formData.scrolls;
  const subject = formData.subject;
  const body = formData.body;

  await login(page, linkedinEmail, linkedinPassword);

  await page.goto(feedUrl);
  await scrollPage(page, scrolls);

  const posts = await page.$$("div.feed-shared-update-v2");

  let emailsToSend = [];
  let successEmails = [];

  for (const post of posts) {
    const emails = await extractEmailsFromPost(post, page);
    if (emails?.length > 0) {
      emailsToSend.push(...emails);
    }
  }

  if (emailsToSend.length > 0) {
    successEmails = await sendEmails(
      emailsToSend,
      gmailEmail,
      gmailPassword,
      cvName,
      cvPath,
      subject,
      body
    );
  }

  await browser.close();

  return successEmails;
}

async function stopExecution() {
  if (browser) {
    await browser.close().then(() => {
      process.exit();
    });
  }
}

module.exports = { runLinkedInEmailSender, stopExecution };
