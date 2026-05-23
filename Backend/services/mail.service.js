const { createTransport } = require("nodemailer");

const isPlaceholder = (value) => !value || value.includes("<") || value.includes(">");

const hasMailCredentials = () =>
  !isPlaceholder(process.env.MAIL_USER) && !isPlaceholder(process.env.MAIL_PASS);

const createMailTransport = () =>
  createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

const sendMail = async (to, subject, html) => {
  if (!hasMailCredentials()) {
    const message =
      "Email is not configured. Set MAIL_USER and MAIL_PASS in Backend/.env.";

    if (process.env.ENVIRONMENT !== "production") {
      console.warn(message);
      return { skipped: true, reason: message };
    }

    throw new Error(message);
  }

  const transport = createMailTransport();
  const info = await transport.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
  return { skipped: false, info };
};

module.exports = {
  sendMail,
};
