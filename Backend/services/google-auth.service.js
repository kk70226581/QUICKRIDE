const axios = require("axios");

const decodeGooglePayloadForDevelopment = (token) => {
  const [, payloadPart] = token.split(".");

  if (!payloadPart) {
    throw new Error("Invalid Google token format");
  }

  const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const payload = JSON.parse(Buffer.from(normalizedPayload, "base64").toString("utf8"));

  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
    throw new Error("Google token has expired");
  }

  return payload;
};

const validateGooglePayload = (payload) => {
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google token audience does not match this app");
  }

  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    throw new Error("Google email is not verified");
  }

  if (!payload.email) {
    throw new Error("Google token does not contain an email");
  }
};

const verifyGoogleToken = async (token) => {
  if (!token) {
    throw new Error("Token is required");
  }

  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes("<")) {
    throw new Error("Google client ID is not configured");
  }

  let payload;

  try {
    const response = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
      params: {
        id_token: token,
      },
    });

    payload = response.data;
  } catch (error) {
    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google tokeninfo verification failed, using development token decode:", error.message);
      payload = decodeGooglePayloadForDevelopment(token);
    } else {
      throw error;
    }
  }

  validateGooglePayload(payload);

  return {
    email: payload.email,
    name: payload.name || payload.email?.split("@")[0] || "User",
    picture: payload.picture,
  };
};

module.exports = {
  verifyGoogleToken,
};
