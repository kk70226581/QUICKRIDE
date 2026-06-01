const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/map.service");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");
const userModel = require("../models/user.model");
const captainModel = require("../models/captain.model");
const paymentService = require("../services/payment.service");

const isDevelopment = () => process.env.ENVIRONMENT !== "production";

const ensureTestCaptain = async (vehicleType) => {
  const email = "testcaptain@quickride.local";
  const location = {
    type: "Point",
    coordinates: [77.209, 28.6139],
  };
  const vehicle = {
    color: "white",
    number: "TEST123",
    capacity: vehicleType === "bike" ? 1 : 4,
    type: vehicleType,
  };

  let captain = await captainModel.findOne({ email });

  if (!captain) {
    captain = await captainModel.create({
      fullname: {
        firstname: "Test",
        lastname: "Captain",
      },
      email,
      password: await captainModel.hashPassword("test12345"),
      phone: "9999999999",
      vehicle,
      location,
      status: "active",
      emailVerified: true,
    });
  } else {
    captain.vehicle = vehicle;
    captain.location = location;
    captain.status = "active";
    captain.emailVerified = true;
    await captain.save();
  }

  return captain;
};

module.exports.chatDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const ride = await rideModel
      .findOne({ _id: id })
      .populate("user", "socketId fullname phone")
      .populate("captain", "socketId fullname phone");

    if (!ride) {
      return res.status(400).json({ message: "Ride not found" });
    }

    const response = {
      user: {
        socketId: ride.user?.socketId,
        fullname: ride.user?.fullname,
        phone: ride.user?.phone,
        _id: ride.user?._id,
      },
      captain: {
        socketId: ride.captain?.socketId,
        fullname: ride.captain?.fullname,
        phone: ride.captain?.phone,
        _id: ride.captain?._id,
      },
      messages: ride.messages,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.rideStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const ride = await rideModel
      .findOne({ _id: id, user: req.user._id })
      .populate("user")
      .populate("captain")
      .select("+otp");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    return res.status(200).json(ride);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;
  const { paymentMethod = "cash" } = req.body;

  try {
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
      paymentMethod,
      paymentDetails: {},
    });

    const user = await userModel.findOne({ _id: req.user._id });
    if (user) {
      user.rides.push(ride._id);
      await user.save();
    }

    res.status(201).json(ride);

    Promise.resolve().then(async () => {
      try {
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        console.log("Pickup Coordinates", pickupCoordinates);

        let captainsInRadius = await mapService.getCaptainsInTheRadius(
          pickupCoordinates.ltd,
          pickupCoordinates.lng,
          4,
          vehicleType
        );

        if (captainsInRadius.length === 0 && isDevelopment()) {
          captainsInRadius = await mapService.getOnlineCaptainsByVehicle(vehicleType);
        }

        ride.otp = "";

        const rideWithUser = await rideModel
          .findOne({ _id: ride._id })
          .populate("user");

        console.log(
          captainsInRadius.map(
            (ride) => `${ride.fullname.firstname} ${ride.fullname.lastname} `
          )
        );

        const onlineCaptains = captainsInRadius.filter((captain) => captain.socketId);
        console.log(
          `Ride ${ride._id}: found ${captainsInRadius.length} matching captains, ${onlineCaptains.length} online.`
        );

        if (onlineCaptains.length === 0 && isDevelopment()) {
          const testCaptain = await ensureTestCaptain(vehicleType);
          const confirmedRide = await rideService.confirmRide({
            rideId: ride._id,
            captain: testCaptain,
          });

          sendMessageToSocketId(confirmedRide.user.socketId, {
            event: "ride-confirmed",
            data: confirmedRide,
          });

          return;
        }

        onlineCaptains.map((captain) => {
          sendMessageToSocketId(captain.socketId, {
            event: "new-ride",
            data: rideWithUser,
          });
        });
      } catch (e) {
        console.error("Background task failed:", e.message);
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.createPaymentOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType, rideId } = req.body;

  try {
    let amount;
    let receipt = `ride_${req.user._id}_${Date.now()}`;

    if (rideId) {
      const ride = await rideModel.findOne({ _id: rideId, user: req.user._id });

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      if (ride.status !== "completed") {
        return res.status(400).json({ message: "Online payment opens after the ride is completed" });
      }

      if (ride.paymentStatus === "paid") {
        return res.status(400).json({ message: "This ride is already paid" });
      }

      amount = ride.fare;
      receipt = `ride_${ride._id}`;
    } else {
      const { fare } = await rideService.getFare(pickup, destination);
      amount = fare[vehicleType];
    }

    const order = await paymentService.createRazorpayOrder({
      amount,
      receipt,
    });

    return res.status(200).json({
      order,
      amount,
      currency: "INR",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create payment order",
      error: error.message,
    });
  }
};

module.exports.verifyPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const isVerified = paymentService.verifyRazorpayPayment(req.body);

  if (!isVerified) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  let ride = null;

  if (req.body.rideId) {
    ride = await rideModel.findOneAndUpdate(
      {
        _id: req.body.rideId,
        user: req.user._id,
        status: "completed",
      },
      {
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        paymentID: req.body.razorpay_payment_id,
        orderId: req.body.razorpay_order_id,
        signature: req.body.razorpay_signature,
      },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ message: "Completed ride not found" });
    }
  }

  return res.status(200).json({
    message: "Payment verified successfully",
    paymentDetails: {
      paymentId: req.body.razorpay_payment_id,
      orderId: req.body.razorpay_order_id,
      signature: req.body.razorpay_signature,
    },
    ride,
  });
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const { fare, distanceTime, fareDetails } = await rideService.getFare(
      pickup,
      destination
    );
    return res.status(200).json({ fare, distanceTime, fareDetails });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const rideDetails = await rideModel.findOne({ _id: rideId });

    if (!rideDetails) {
      return res.status(404).json({ message: "Ride not found." });
    }

    switch (rideDetails.status) {
      case "accepted":
        return res
          .status(400)
          .json({
            message:
              "The ride is accepted by another captain before you. Better luck next time.",
          });

      case "ongoing":
        return res
          .status(400)
          .json({
            message: "The ride is currently ongoing with another captain.",
          });

      case "completed":
        return res
          .status(400)
          .json({ message: "The ride has already been completed." });

      case "cancelled":
        return res
          .status(400)
          .json({ message: "The ride has been cancelled." });

      default:
        break;
    }

    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    // TODO: Remove ride from other captains
    // Implement logic here, maybe emit an event or update captain listings

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    const statusCode = /not found|not accepted|invalid otp/i.test(err.message) ? 400 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    const statusCode = /not found|cannot be ended|could not be completed/i.test(err.message) ? 400 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
};

module.exports.cancelRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.query;

  try {
    const ride = await rideModel.findOneAndUpdate(
      { _id: rideId },
      {
        status: "cancelled",
      },
      { new: true }
    );

    try {
      const pickupCoordinates = await mapService.getAddressCoordinate(ride.pickup);
      const captainsInRadius = await mapService.getCaptainsInTheRadius(
        pickupCoordinates.ltd,
        pickupCoordinates.lng,
        4,
        ride.vehicle
      );

      captainsInRadius.map((captain) => {
        sendMessageToSocketId(captain.socketId, {
          event: "ride-cancelled",
          data: ride,
        });
      });
    } catch (socketError) {
      console.warn("Ride cancelled, but nearby captain notification failed:", socketError.message);
    }

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
