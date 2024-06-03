import { promises as fsPromises } from "fs";
import path from "path";
import { parse } from 'csv-parse/sync';
import { createTransport } from 'nodemailer';

const csvFilePath = path.resolve(__dirname, 'files/waitlist.csv');
const sentEmailsFilePath = path.resolve(__dirname, 'files/sentEmails.json');
const retryDelay = 3600000; // 1 hour in milliseconds

const readAndParseCSV = async (filePath) => {
    const fileContent = await fsPromises.readFile(filePath);
    return parse(fileContent, { columns: true });
};

const loadSentEmails = async (filePath) => {
    try {
        const fileContent = await fsPromises.readFile(filePath);
        const emails = JSON.parse(fileContent.toString());
        return new Set(emails);
    } catch (error) {
        return new Set();
    }
};

const saveSentEmails = async (sentEmails, filePath) => {
    const jsonContent = JSON.stringify(Array.from(sentEmails));
    await fsPromises.writeFile(filePath, jsonContent);
};

const sendEmail = async (name, email, sentEmails, remaining) => {
    if (sentEmails.has(email)) {
        console.log(`Skipping email to ${email} as it has already been sent.`);
        return true;
    }

    const transporter = createTransport({
        host: process.env.HOST,
        port: parseInt(process.env.PORT || '0', 10),
        secure: process.env.SECURE === 'true',
        auth: {
            user: process.env.AUTH_USER,
            pass: process.env.AUTH_PASS
        }
    });

    const mailOptions = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: `Welcome to Mythic, ${name}!`,
        html: `
        <html>
        <div class="email"
            style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 10px; font-family: 'SF Pro', 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #333;">
            <img style="width: 50px; height: auto; margin-bottom: 20px;" src="https://getmythic.app/favicon.ico"
                alt="Mythic Logo">
            <div>
                <h2 style="margin-bottom: 10px;">Welcome to Mythic, ${name}!</h2>
                <p style="margin-bottom: 20px;">You've been invited as one of the first to join the universe of Windows gaming
                    on macOS through Mythic! Have fun and make sure to join the <a href="https://getmythic.app/discord"
                        style="color: #007bff; text-decoration: none;">Discord server</a> for any updates or support/feedback.
                </p>
            </div>
            <a class="button-md" href="https://getmythic.app/download"
                style="display: inline-block; margin-bottom: 20px; background-color: #0071e3; color: #fff !important; border: 0; outline: 0; font-size: 16px; line-height: 1.33337; font-weight: 400; letter-spacing: -.01em; min-width: 23px; padding: 8px 16px; border-radius: 18px; text-decoration: none;">Download</a>
            <div style="opacity: 0.8; margin-top: 20px;">© 2024 Mythic. All rights reserved. Not affiliated with Apple or any
                game platform.</div>
        </div>
        </html>
        `,
        headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High',
            'X-Mailer': 'Mythic Mailer'
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}. ${remaining - 1} more to go.`);
        sentEmails.add(email);
        await saveSentEmails(sentEmails, sentEmailsFilePath);
        return true;
    } catch (error) {
        if (error.message.includes('Policy Rejection- Outgoing quota is Exceeded')) {
            console.error(`Outgoing quota exceeded. Retrying in one hour.`);
            setTimeout(() => processCSV(), retryDelay);
            return false;
        }
        console.error(`Error sending email to ${name} (${email}): ${error}`);
        return true;
    }
};

const processCSV = async () => {
    const rows = await readAndParseCSV(csvFilePath);
    const sentEmails = await loadSentEmails(sentEmailsFilePath);

    const rowsToProcess = rows.filter(row => row['1. How should we call you?'] && row['2. What\'s your e-mail address?'] && row['Finished'] === 'Yes');
    let remaining = rowsToProcess.length;

    for (const row of rowsToProcess) {
        const success = await sendEmail(row['1. How should we call you?'], row['2. What\'s your e-mail address?'], sentEmails, remaining);
        if (!success) {
            return; // Stop processing if retry is scheduled
        }
        remaining--;
    }
    console.log(`All emails have been sent. Total emails sent: ${sentEmails.size}`);
};

processCSV().catch(console.error);