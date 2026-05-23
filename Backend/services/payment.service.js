const axios = require("axios");
const crypto = require("crypto");

const isPlaceholder = (value) => !value || value.includes("<") || value.includes(">");

const hasRazorpayCredentials = () =>
  !isPlaceholder(process.env.RAZORPAY_KEY_ID) &&
  !isPlaceholder(process.env.RAZORPAY_KEY_SECRET);

const createRazorpayOrder = async ({ amount, receipt }) => {
  const amountInPaise = Math.round(amount * 100);
  const safeReceipt = String(receipt).slice(0, 40);

  if (!hasRazorpayCredentials() && process.env.ENVIRONMENT !== "production") {
    return {
      id: `order_dev_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      receipt: safeReceipt,
      keyId: "rzp_test_development",
      devMode: true,
    };
  }

  try {
    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amountInPaise,
        currency: "INR",
        receipt: safeReceipt,
        payment_capture: 1,
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );

    return {
      ...response.data,
      keyId: process.env.RAZORPAY_KEY_ID,
      devMode: false,
    };
  } catch (error) {
    const message =
      error.response?.data?.error?.description ||
      error.response?.data?.message ||
      error.message;

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Razorpay order failed, using development payment mode:", message);
      return {
        id: `order_dev_${Date.now()}`,
        amount: amountInPaise,
        currency: "INR",
        receipt: safeReceipt,
        keyId: "rzp_test_development",
        devMode: true,
        warning: message,
      };
    }

    throw new Error(message);
  }
};

const verifyRazorpayPayment = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!hasRazorpayCredentials() && process.env.ENVIRONMENT !== "production") {
    return razorpay_order_id?.startsWith("order_dev_");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return generatedSignature === razorpay_signature;
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
