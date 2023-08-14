async function scrollPage(page, times) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(200);
  }
}

module.exports = scrollPage;
