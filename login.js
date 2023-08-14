const feedUrl = "https://www.linkedin.com/feed/";

async function login(page) {
  await page.goto(feedUrl);

  const signInLink = await page.$(".main__sign-in-link");

  if (signInLink) {
    await signInLink.click();
    await page.waitForSelector("#username");

    await page.type("#username", process.env.LINKEDIN_EMAIL);
    await page.type("#password", process.env.LINKEDIN_PASSWORD);

    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  }
}

module.exports = login;
