# Mythic Emailing

This project is a script for sending welcome emails to users based on a CSV file.

## Installation

1. Clone the repository.
2. Install the dependencies by running `bun i`.

## Usage

1. Place your CSV file in the `files` directory.
2. Set the required environment variables by renaming the `.env.example` file to `.env` and filling in the following values:
    - `HOST`: SMTP host for sending emails.
    - `PORT`: SMTP port.
    - `SECURE`: Set to `true` if the connection should be secure.
    - `AUTH_USER`: SMTP username.
    - `AUTH_PASS`: SMTP password.
    - `FROM_EMAIL`: Email address to use as the sender.
3. Run the script by executing `bun index.ts`.

## CSV File Format

The CSV file should have the following columns:
- `1. How should we call you?`: User's name.
- `2. What's your e-mail address?`: User's email address.
- `Finished`: Set to `Yes` if the user should receive the welcome email.

## Email Template

The welcome email template is defined in the `mailOptions` object in the code. You can customize the HTML content to fit your needs.

## Dependencies

- `fs`: File system module for reading the CSV file.
- `path`: Path module for resolving file paths.
- `csv-parse`: CSV parsing library for parsing the CSV file.
- `nodemailer`: Library for sending emails.