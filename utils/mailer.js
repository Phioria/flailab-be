const nodemailer = require('nodemailer');

// TODO Update this function with a try catch block to catch errors
const sendMail = async (recipientEmail, recipientFirstName, tokenLink) => {
    // Define Transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.forwardemail.net',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_SECRET,
        },
    });

    // Send mail with defined transport object
    // TODO Change verify link to a frontend link for cors to work
    const info = await transporter.sendMail({
        from: '"FLaiLab" <admin@flailab.com>', // Sender address
        to: recipientEmail,
        subject: 'Welcome to FLaiLab!',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
            <title>Document</title>
        </head>
        <body>
            <h3>Hi ${recipientFirstName}!</h3>
            <p> Thanks for signing up for <a href="https://www.flailab.com">FLaiLab!</a> We hope you enjoy this service.<br>
            If you have any problems or suggestions, feel free to reach out to: chris.baugh@gmail.com<br>
            Please click the link below to verify your account.</p>
        
            <a class="btn btn-primary" href=${tokenLink} role="button">Verify Account</a>
        
            <p><br>If the link above does not work, just copy and paste the link below into your browser.<br>
            ${tokenLink}
            </p>
        </body>
        </html>`,
    });

    return info;
};

const updatePasswordLink = async (recipientEmail, tokenLink) => {
    // Define Transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.forwardemail.net',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_SECRET,
        },
    });

    // Send mail with defined transport object
    // TODO Change verify link to a frontend link for cors to work
    const info = await transporter.sendMail({
        from: '"FlaiLab" <admin@flailab.com>', // Sender address
        to: recipientEmail,
        subject: 'Password Reset Request',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
            <title>Document</title>
        </head>
        <body>
            <h3>Hi ${recipientEmail}!</h3>
            <p>We've received your request to reset your password. Please click the link below
            to reset your password. The link is only valid for 20 minutes. If you did not request
            this, then you can safely disregard this E-mail.</p>
        
            <a class="btn btn-primary" href=${tokenLink} role="button">Reset Password</a>
        
            <p><br>If the link above does not work, just copy and paste the link below into your browser.<br>
            ${tokenLink}
            </p>
        </body>
        </html>`,
    });

    return info;
};

module.exports = { sendMail, updatePasswordLink };
