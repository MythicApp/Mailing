import { promises as fsPromises } from "fs";
import path from "path";
import { parse } from 'csv-parse/sync';
import { createTransport } from 'nodemailer';

const csvFilePath = path.resolve(__dirname, 'files/test.csv');
const sentEmailsFilePath = path.resolve(__dirname, 'files/sentEmails.json');

const readAndParseCSV = async (filePath: string) => {
    const fileContent = await fsPromises.readFile(filePath);
    return parse(fileContent, { columns: true });
};

const loadSentEmails = async (filePath: string) => {
    try {
        const fileContent = await fsPromises.readFile(filePath);
        const emails = JSON.parse(fileContent.toString());
        return new Set(emails);
    } catch (error) {
        return new Set<string>();
    }
};

const saveSentEmails = async (sentEmails: Set<string>, filePath: string) => {
    const jsonContent = JSON.stringify(Array.from(sentEmails));
    await fsPromises.writeFile(filePath, jsonContent);
};

const sendEmail = async (name: string, email: string, sentEmails: Set<string>) => {
    if (sentEmails.has(email)) {
        return console.log(`Skipping email to ${email} as it has already been sent.`);
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
        <div class="email"
        style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 10px; font-family: 'SF Pro', 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #333;">
        <img style="width: 50px; height: auto; margin-bottom: 20px;" src="https://getmythic.app/favicon.ico"
            alt="Mythic Logo">
        <div>
            <h2 style="margin-bottom: 10px;">Welcome to Mythic, ${name}!</h2>
            <p style="margin-bottom: 20px;">You've been invited as one of the first to join the universe of Windows gaming
                on macOS through Mythic! Have fun and make sure to join the <a href="https://discord.gg/58NZ7fFqPy"
                    style="color: #007bff; text-decoration: none;">Discord server</a> for any updates or support/feedback.
            </p>
        </div>
        <a class="button-md" href="https://getmythic.app/download"
            style="display: inline-block; margin-bottom: 20px; background-color: #0071e3; color: #fff !important; border: 0; outline: 0; font-size: 16px; line-height: 1.33337; font-weight: 400; letter-spacing: -.01em; min-width: 23px; padding: 8px 16px; border-radius: 18px; text-decoration: none;">Download</a>
        <div style="opacity: 0.8; margin-top: 20px;">© 2024 Mythic. All rights reserved. Not affiliated with Apple or any
            game platform.</div>
    </div>
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
        console.log(`Email sent to ${email}`);
        sentEmails.add(email);
        await saveSentEmails(sentEmails, sentEmailsFilePath);
    } catch (error) {
        console.error(`Error sending email to ${name} (${email}): ${error}`);
    }
};

const processCSV = async () => {
    const rows = await readAndParseCSV(csvFilePath);
    const sentEmails = await loadSentEmails(sentEmailsFilePath);

    for (const row of rows) {
        if (row['1. How should we call you?'] && row['2. What\'s your e-mail address?'] && row['Finished'] === 'Yes') {
            await sendEmail(row['1. How should we call you?'], row['2. What\'s your e-mail address?'], sentEmails as Set<string>);
        }
    }
};

processCSV().catch(console.error);