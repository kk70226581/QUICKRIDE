const asyncHandler = require("express-async-handler");
const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { verifyGoogleToken } = require("../services/google-auth.service");

const splitGoogleName = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstname: parts[0] || "",
    lastname: parts.slice(1).join(" "),
  };
};

const normalizeOAuthProfile = (profile = {}, googleName = "") => {
  const googleFullname = splitGoogleName(googleName);
  const fullname = profile.fullname || {};

  return {
    fullname: {
      firstname: (fullname.firstname || googleFullname.firstname || "").trim(),
      lastname: (fullname.lastname || googleFullname.lastname || "").trim(),
    },
    phone: String(profile.phone || "").trim(),
  };
};

const validateOAuthUserProfile = ({ fullname, phone }) => {
  if (!fullname.firstname || fullname.firstname.length < 3) {
    return "First name must be at least 3 characters long";
  }

  if (fullname.lastname && fullname.lastname.length < 3) {
    return "Last name must be at least 3 characters long";
  }

  if (!/^\d{10}$/.test(phone)) {
    return "Phone number should be of 10 digits only";
  }

  return null;
};

const createOAuthPassword = () => crypto.randomBytes(24).toString("hex");

module.exports.registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone } = req.body;

  const alreadyExists = await userModel.findOne({ email });

  if (alreadyExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await userService.createUser(
    fullname.firstname,
    fullname.lastname,
    email,
    password,
    phone
  );

  const token = user.generateAuthToken();
  res
    .status(201)
    .json({ message: "User registered successfully", token, user });
});

module.exports.verifyEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Invalid verification link", error: "Token is required" });
  }

  let decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedTokenData || decodedTokenData.purpose !== "email-verification") {
    return res.status(400).json({ message: "You're trying to use an invalid or expired verification link", error: "Invalid token" });
  }

  let user = await userModel.findOne({ _id: decodedTokenData.id });

  if (!user) {
    return res.status(404).json({ message: "User not found. Please ask for another verification link." });
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  user.emailVerified = true;
  await user.save();

  res.status(200).json({
    message: "Email verified successfully",
  });
});

module.exports.loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    res.status(404).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = user.generateAuthToken();
  res.cookie("token", token);

  res.json({
    message: "Logged in successfully",
    token,
    user: {
      _id: user._id,
      fullname: {
        firstname: user.fullname.firstname,
        lastname: user.fullname.lastname,
      },
      email: user.email,
      phone: user.phone,
      rides: user.rides,
      socketId: user.socketId,
      emailVerified: user.emailVerified,
    },
  });
});

module.exports.userProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports.updateUserProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname,  phone } = req.body;

  const updatedUserData = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      fullname: fullname,
      phone,
    },
    { new: true }
  );

  res
    .status(200)
    .json({ message: "Profile updated successfully", user: updatedUserData });
});

module.exports.logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  const token = req.cookies.token || req.headers.token;

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token, password } = req.body;
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({
        message:
          "This password reset link has expired or is no longer valid. Please request a new one to continue",
      });
    } else {
      return res.status(400).json({
        message:
          "The password reset link is invalid or has already been used. Please request a new one to proceed",
        error: err,
      });
    }
  }

  const user = await userModel.findById(payload.id);
  if (!user)
    return res.status(404).json({
      message: "User not found. Please check your credentials and try again",
    });

  user.password = await userModel.hashPassword(password);
  await user.save();

  res.status(200).json({
    message:
      "Your password has been successfully reset. You can now log in with your new credentials",
  });
});

module.exports.googleSignInUser = asyncHandler(async (req, res) => {
  const { token, profile } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const { email, name, picture } = await verifyGoogleToken(token);

    let user = await userModel.findOne({ email });

    if (!user) {
      const oauthProfile = normalizeOAuthProfile(profile, name);
      const profileError = validateOAuthUserProfile(oauthProfile);

      if (!profile || profileError) {
        return res.status(409).json({
          message: profileError || "Complete your profile to continue with Google signup",
          profileRequired: true,
          googleProfile: {
            fullname: oauthProfile.fullname,
            email,
            profileImage: picture,
          },
        });
      }

      user = await userService.createUser(
        oauthProfile.fullname.firstname,
        oauthProfile.fullname.lastname || undefined,
        email,
        createOAuthPassword(),
        oauthProfile.phone
      );
      user.emailVerified = true;
      user.profileImage = picture;
      await user.save();
    }

    const appToken = user.generateAuthToken();
    res.cookie("token", appToken);

    res.status(200).json({
      message: "Logged in successfully with Google",
      token: appToken,
      user: {
        _id: user._id,
        fullname: {
          firstname: user.fullname.firstname,
          lastname: user.fullname.lastname,
        },
        email: user.email,
        phone: user.phone,
        rides: user.rides,
        socketId: user.socketId,
        emailVerified: user.emailVerified,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(401).json({
      message: "Invalid Google token or authentication failed",
      error: error.message,
    });
  }
});
