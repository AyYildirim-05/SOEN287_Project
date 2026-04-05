require("dotenv").config({ path: "./.env" });

const { sendEmail } = require("./utils/emailService");

async function runTest() {
    try {
        await sendEmail(
            process.env.EMAIL_USER,
            "Test Email",
            "This is a test email from Smart Course Companion."
        );
        console.log("Test email sent successfully.");
    } catch (error) {
        console.error("Test email failed:", error);
    }
}

runTest();