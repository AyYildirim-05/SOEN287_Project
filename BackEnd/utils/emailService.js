// BackEnd/utils/emailService.js
const nodemailer = require("nodemailer");

function createTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables.");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

async function sendEmail(to, subject, text) {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent to:", to);
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
}

async function sendDeadlineReminder(to, assignmentTitle, dueDate, courseName) {
    const subject = "Assignment Deadline Reminder";
    const text = `Reminder: Your assignment "${assignmentTitle}" for ${courseName} is due on ${new Date(dueDate).toLocaleString()}.`;

    await sendEmail(to, subject, text);
}

module.exports = {
    sendEmail,
    sendDeadlineReminder
};