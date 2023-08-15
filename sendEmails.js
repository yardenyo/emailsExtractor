const fs = require("fs");
const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmails(emails, gmailEmail, gmailPassword, cvFile) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });

  const linkedinPost = process.env.LINKEDIN_POST;

  // Load the blacklist from the JSON file
  let blacklist = [];
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
        subject: "קורות חיים - ירדן יוסף",
        html: `
      <p>
        שלום.<br>
        שמי ירדן יוסף ואני מחפש את האתגר הבא שלי בתחום הWeb כאשר הדגש הוא על פיתוח Full Stack/Front End.<br>
        ראיתי שפרסמת בלינקדאין את המייל שלך וחשבתי שאולי יעניין אותך לקבל את קורות החיים שלי.<br>
        בנוסף, אני מצרף פוסט בו פרסמתי פרטים נוספים על עצמי ועל מה שאני מחפש.<br>
        <a href="${linkedinPost}">קישור לפוסט</a><br><br>
        אשמח לשמוע ממך בקרוב, תודה.
      </p>
      <br>
      <p>
        Hello,<br>
        My name is Yarden Yosef, and I'm seeking my next challenge in the field of Web development, with a focus on Full Stack/Front End development.<br>
        I noticed that you've posted your email on LinkedIn, and I thought you might be interested in receiving my resume.<br>
        Additionally, I'm attaching a post where I've shared more details about myself and what I'm looking for.<br>
        <a href="${linkedinPost}">Link to the post</a><br><br>
        I'd love to hear from you soon. Thank you.
      </p>
    `,
        attachments: [
          {
            filename: "CV Yarden Yosef.pdf",
            path: "./attachments/CV Yarden Yosef.pdf",
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
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
      }
    } else {
      console.log(`Skipping ${email} because it's in the blacklist`);
    }
  }
}

function hasBeenAMonth(startDate, endDate) {
  const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000; // 30 days per month
  const timeDiff = endDate - new Date(startDate);
  return timeDiff >= oneMonthInMillis;
}

module.exports = sendEmails;
