import * as fs from "fs";
import * as path from "path";
import { parse } from 'csv-parse';
import { createTransport } from 'nodemailer';

const csvFilePath = path.resolve(__dirname, 'files/test.csv');

let headers: string[] = [];

fs.createReadStream(csvFilePath)
    .pipe(parse({ columns: true }))
    .on('headers', (headerList) => {
        headers = headerList;
    })
    .on('data', (row) => {
        if (row['1. How should we call you?'] && row['2. What\'s your e-mail address?'] && row['Finished'] === 'Yes') {
            const name = row['1. How should we call you?'];
            const email = row['2. What\'s your e-mail address?'];

            const transporter = createTransport({
                host: process.env.HOST,
                port: parseInt(process.env.PORT || '0'),
                secure: process.env.SECURE === 'true',
                auth: {
                    user: process.env.AUTH_USER,
                    pass: process.env.AUTH_PASS
                }
            });

            const mailOptions = {
                from: process.env.FROM_EMAIL,
                to: email,
                subject: 'Welcome to Mythic!',
                html: `
                    <div style="background: white; display: flex; flex-direction: column; width: 100%; font-family: 'SF Pro', 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #333;">
                        <img style="width: 70px; height: auto;" src="https://getmythic.app/favicon.ico" alt="Mythic Logo">
                        <div>
                            <h2>Hey ${name},</h2>
                            <p style="margin-bottom: 20px;">You've been invited as one of the first to join the universe of Windows gaming on macOS through Mythic! GLHF and make sure to join the <a href="https://discord.gg/58NZ7fFqPy" style="color: #007bff;">Discord server</a> for any updates or support.</p>
                        </div>
                        <a href="https://getmythic.app/download" style="width: 72px; display: inline-block; padding: 10px 20px; background-color: #0071E3; color: #fff; text-decoration: none; border-radius: 8px;">Download</a>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${email}: ${error}`);
                } else {
                    console.log(`Email sent to ${email}`);
                }
            });
        }
    })