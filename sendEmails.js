const fs = require("fs");
const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmails(
  emails,
  gmailEmail,
  gmailPassword,
  cvName,
  cvPath,
  subject,
  body
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });

  let blacklist = [];
  let successEmails = [];
  try {
    const blacklistData = fs.readFileSync("blacklist.json", "utf8");
    blacklist = JSON.parse(blacklistData);
  } catch (error) {
    console.error("Error loading blacklist:", error);
  }

  const now = new Date();

  for (const email of emails) {
    const blacklistEntry = blacklist.find((entry) => entry.email === email);
    if (!blacklistEntry || hasBeenAMonth(blacklistEntry.date, now)) {
      const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: email,
        subject: subject,
        html: body,
        attachments: [
          {
            filename: cvName,
            path: cvPath,
          },
        ],
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}:`, info.response);

        if (blacklistEntry) {
          blacklistEntry.date = now.toISOString();
        } else {
          blacklist.push({ email, date: now.toISOString() });
        }
        fs.writeFileSync("blacklist.json", JSON.stringify(blacklist), "utf8");

        successEmails.push(email);
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
      }
    }
  }

  return successEmails;
}

function hasBeenAMonth(startDate, endDate) {
  const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000;
  const timeDiff = endDate - new Date(startDate);
  return timeDiff >= oneMonthInMillis;
}

module.exports = sendEmails;
