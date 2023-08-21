const feedUrl = "https://www.linkedin.com/feed/";

async function login(page, linkedinEmail, linkedinPassword) {
  await page.goto(feedUrl);

  const signInLink = await page.$(".main__sign-in-link");

  if (signInLink) {
    await signInLink.click();
    await page.waitForSelector("#username");

    await page.type("#username", linkedinEmail);
    await page.type("#password", linkedinPassword);

    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  }
}

module.exports = login;
