const asyncHandler = require("express-async-handler");
const captainModel = require("../models/captain.model");
const captainService = require("../services/captain.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const jwt = require("jsonwebtoken");
const rideModel = require("../models/ride.model");
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
  const vehicle = profile.vehicle || {};

  return {
    fullname: {
      firstname: (fullname.firstname || googleFullname.firstname || "").trim(),
      lastname: (fullname.lastname || googleFullname.lastname || "").trim(),
    },
    phone: String(profile.phone || "").trim(),
    vehicle: {
      color: String(vehicle.color || "").trim(),
      number: String(vehicle.number || "").trim().toUpperCase(),
      capacity: Number(vehicle.capacity),
      type: String(vehicle.type || "").trim().toLowerCase(),
    },
  };
};

const validateOAuthCaptainProfile = ({ fullname, phone, vehicle }) => {
  if (!fullname.firstname || fullname.firstname.length < 3) {
    return "First name must be at least 3 characters long";
  }

  if (fullname.lastname && fullname.lastname.length < 2) {
    return "Last name must be at least 2 characters long";
  }

  if (!/^\d{10}$/.test(phone)) {
    return "Phone Number should be of 10 characters only";
  }

  if (!vehicle.color || vehicle.color.length < 3) {
    return "Vehicle color must be at least 3 characters long";
  }

  if (!vehicle.number || vehicle.number.length < 3) {
    return "Vehicle number must be at least 3 characters long";
  }

  if (!Number.isInteger(vehicle.capacity) || vehicle.capacity < 1 || vehicle.capacity > 8) {
    return "Vehicle capacity must be between 1 and 8";
  }

  if (!["car", "bike", "auto"].includes(vehicle.type)) {
    return "Vehicle type must be car, bike, or auto";
  }

  return null;
};

const createOAuthPassword = () => crypto.randomBytes(24).toString("hex");

module.exports.registerCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone, vehicle } = req.body;

  const alreadyExists = await captainModel.findOne({ email });

  if (alreadyExists) {
    return res.status(400).json({ message: "Captain already exists" });
  }

  const captain = await captainService.createCaptain(
    fullname.firstname,
    fullname.lastname,
    email,
    password,
    phone,
    vehicle.color,
    vehicle.number,
    vehicle.capacity,
    vehicle.type
  );

  const token = captain.generateAuthToken();
  res
    .status(201)
    .json({ message: "Captain registered successfully", token, captain });
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
  
    let captain = await captainModel.findOne({ _id: decodedTokenData.id });
  
    if (!captain) {
      return res.status(404).json({ message: "User not found. Please ask for another verification link." });
    }
  
    if (captain.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
  
    captain.emailVerified = true;
    await captain.save();
  
    res.status(200).json({
      message: "Email verified successfully",
    });
});

module.exports.loginCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  const captain = await captainModel.findOne({ email }).select("+password");
  if (!captain) {
    res.status(404).json({ message: "Invalid email or password" });
  }

  const isMatch = await captain.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = captain.generateAuthToken();
  res.cookie("token", token);
  res.json({ message: "Logged in successfully", token, captain });
});

module.exports.captainProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ captain: req.captain });
});

module.exports.captainEarnings = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedRides = await rideModel
    .find({
      captain: req.captain._id,
      status: "completed",
    })
    .select("fare distance paymentMethod paymentStatus updatedAt createdAt");

  const summary = completedRides.reduce(
    (acc, ride) => {
      const completedAt = ride.updatedAt || ride.createdAt;
      const fare = Number(ride.fare) || 0;

      acc.lifetime += fare;
      acc.completedRides += 1;
      acc.distanceKm += (Number(ride.distance) || 0) / 1000;

      if (ride.paymentMethod === "cash") acc.cash += fare;
      if (ride.paymentMethod === "razorpay") acc.online += fare;
      if (ride.paymentStatus === "paid") acc.paid += fare;
      if (ride.paymentStatus !== "paid") acc.pending += fare;

      if (completedAt >= startOfToday) {
        acc.today += fare;
        acc.todayRides += 1;
      }

      if (completedAt >= startOfMonth) {
        acc.month += fare;
        acc.monthRides += 1;
      }

      return acc;
    },
    {
      today: 0,
      month: 0,
      lifetime: 0,
      paid: 0,
      pending: 0,
      cash: 0,
      online: 0,
      completedRides: 0,
      todayRides: 0,
      monthRides: 0,
      distanceKm: 0,
    }
  );

  summary.distanceKm = Math.round(summary.distanceKm);

  res.status(200).json({ earnings: summary });
});

module.exports.updateCaptainProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { captainData } = req.body;
  const updatedCaptainData = await captainModel.findOneAndUpdate(
    { email: req.captain.email },
    captainData,
    { new: true }
  );

  res.status(200).json({
    message: "Profile updated successfully",
    user: updatedCaptainData,
  });
});

module.exports.logoutCaptain = asyncHandler(async (req, res) => {
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
      return res.status(400).json({ message: "This password reset link has expired or is no longer valid. Please request a new one to continue" });
    } else {
      return res.status(400).json({ message: "The password reset link is invalid or has already been used. Please request a new one to proceed", error: err });
    }
  }

  const captain = await captainModel.findById(payload.id);
  if (!captain) return res.status(404).json({ message: "User not found. Please check your credentials and try again" });

  captain.password = await captainModel.hashPassword(password);
  await captain.save();

  res.status(200).json({ message: "Your password has been successfully reset. You can now log in with your new credentials" });
});

module.exports.googleSignInCaptain = asyncHandler(async (req, res) => {
  const { token, profile } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const { email, name, picture } = await verifyGoogleToken(token);

    let captain = await captainModel.findOne({ email });

    if (!captain) {
      const oauthProfile = normalizeOAuthProfile(profile, name);
      const profileError = validateOAuthCaptainProfile(oauthProfile);

      if (!profile || profileError) {
        return res.status(409).json({
          message: profileError || "Complete your captain profile to continue with Google signup",
          profileRequired: true,
          googleProfile: {
            fullname: oauthProfile.fullname,
            email,
            profileImage: picture,
          },
        });
      }

      captain = await captainService.createCaptain(
        oauthProfile.fullname.firstname,
        oauthProfile.fullname.lastname || undefined,
        email,
        createOAuthPassword(),
        oauthProfile.phone,
        oauthProfile.vehicle.color,
        oauthProfile.vehicle.number,
        oauthProfile.vehicle.capacity,
        oauthProfile.vehicle.type
      );
      captain.emailVerified = true;
      captain.profileImage = picture;
      await captain.save();
    }

    const appToken = captain.generateAuthToken();
    res.cookie("token", appToken);

    res.status(200).json({
      message: "Logged in successfully with Google",
      token: appToken,
      captain: {
        _id: captain._id,
        fullname: {
          firstname: captain.fullname.firstname,
          lastname: captain.fullname.lastname,
        },
        email: captain.email,
        phone: captain.phone,
        rideHistory: captain.rideHistory,
        socketId: captain.socketId,
        emailVerified: captain.emailVerified,
        profileImage: captain.profileImage,
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
