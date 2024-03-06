import * as fs from "fs";
import * as path from "path";
import { parse } from 'csv-parse';
import { createTransport } from 'nodemailer';

const csvFilePath = path.resolve(__dirname, 'files/test.csv');

let headers: string[] = [];
const sentEmails = new Set<string>();

fs.createReadStream(csvFilePath)
    .pipe(parse({ columns: true }))
    .on('headers', (headerList) => {
        headers = headerList;
    })
    .on('data', (row) => {
        if (row['1. How should we call you?'] && row['2. What\'s your e-mail address?'] && row['Finished'] === 'Yes') {
            const name = row['1. How should we call you?'];
            const email = row['2. What\'s your e-mail address?'];

            if (sentEmails.has(email)) {
                return console.log(`Skipping email to ${email} as it has already been sent.`);
            }

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
                subject: `Welcome to Mythic, ${name}!`,
                html: `
                <div class="email"
                style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 10px; font-family: 'SF Pro', 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #333;">
                <img style="width: 50px; height: auto; margin-bottom: 20px;"
                    src="https://cdn.discordapp.com/attachments/1173271964408881192/1214848788490100756/icon.png?ex=65fa9b19&is=65e82619&hm=7a17572f9b31ee3d19b029f6bee5dcfbdc63136046b2dc8295467e057f655f08&"
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

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${name} (${email}): ${error}`);
                } else {
                    console.log(`Email sent to ${email}`);
                    sentEmails.add(email);
                }
            });
        }
    });