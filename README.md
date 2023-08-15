# LinkedIn Email Scraper

This repository contains a Node.js script that uses Puppeteer to scrape emails from LinkedIn comments and send notification emails if certain keywords are found.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Scheduling](#scheduling)
- [License](#license)

## Features

- Automatically logs in to LinkedIn.
- Scrolls through the feed to load more posts and comments.
- Extracts emails from comments.
- Checks for specific keywords in comments.
- Sends email notifications for matching comments.

## Installation

1. Clone the repository: git clone https://github.com/yourusername/linkedin-email-scraper.git

2. Install dependencies: npm install

3. Create a .env file in the root directory and add the following:

- LINKEDIN_EMAIL=yourlinkedinemail
- LINKEDIN_PASSWORD=yourlinkedinpassword
- GMAIL_EMAIL=yourgmailaddress
- GMAIL_PASSWORD=yourgmailpassword (you may need to generate an app password)
- LINKEDIN_POST=yourlinkedinposturl

4. create a blacklist.json file in the root directory and add the following: '[]'

5. edit the sendEmails.js file and change the subject and body of the email to your liking.

6. Run the script: npm start

## Usage

The script will automatically log in to LinkedIn and start scrolling through the feed to load more posts and comments. It will then extract emails from comments and check for specific keywords. If a comment contains a keyword, it will send an email notification to the specified email address.

## Configuration

You can configure the script by editing the .env file in the root directory.

- LINKEDIN_EMAIL: Your LinkedIn email address.
- LINKEDIN_PASSWORD: Your LinkedIn password.
- GMAIL_EMAIL: Your Gmail address.
- GMAIL_PASSWORD: Your Gmail password (you may need to generate an app password).
- LINKEDIN_POST: The URL of the LinkedIn post you want to scrape comments from.

You can also configure the script by editing the sendEmails.js file in the root directory.

- subject: The subject of the email notification.
- html: The body of the email notification.

## Scheduling

You can schedule the script to run at regular intervals using cron or any other scheduling tool.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
