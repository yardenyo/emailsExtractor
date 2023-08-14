const vocabulary = require("./vocabulary.json");

async function extractEmailsFromPost(post, page) {
  const commentButton = await post.$("button.comment-button");
  if (commentButton) {
    await commentButton.click();
    await page.waitForTimeout(1000);
  }

  let loadMoreCommentsButton = await post.$(
    "button.comments-comments-list__load-more-comments-button"
  );

  let i = 0;

  while (loadMoreCommentsButton && i < 15) {
    await loadMoreCommentsButton.click();
    await page.waitForTimeout(2000);

    loadMoreCommentsButton = await post.$(
      "button.comments-comments-list__load-more-comments-button"
    );
    i++;
  }

  const loadPreviousRepliesButtons = await post.$$("button.show-prev-replies");

  for (const button of loadPreviousRepliesButtons) {
    await button.click();
    await page.waitForTimeout(2000);
  }

  try {
    await post.waitForSelector("div.comments-comments-list", {
      timeout: 10000,
    });

    await page.waitForTimeout(3000);

    const comments = await post.$$("article.comments-comment-item");
    let emailsToSave = [];

    for (const comment of comments) {
      const commentContent = await comment.evaluate((el) =>
        el.innerText.trim()
      );

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emailFound = commentContent.match(emailRegex);
      const containsVocabulary = vocabulary.some((word) =>
        commentContent.includes(word)
      );

      if (containsVocabulary && emailFound) {
        emailsToSave.push(...emailFound);
      }
    }
    return emailsToSave;
  } catch (error) {
    console.error("Error while waiting for comments:", error.message);
  }
}

module.exports = extractEmailsFromPost;
