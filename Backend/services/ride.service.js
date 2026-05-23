const captainModel = require("../models/captain.model");
const rideModel = require("../models/ride.model");
const mapService = require("./map.service");
const crypto = require("crypto");

const getFare = async (pickup, destination) => {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  const distanceTime = await mapService.getDistanceTime(pickup, destination);
  const distanceKm = distanceTime.distance.value / 1000;
  const durationMinutes = distanceTime.duration.value / 60;

  const pricing = {
    auto: { base: 30, perKm: 10, perMinute: 2, minimum: 55 },
    car: { base: 50, perKm: 15, perMinute: 3, minimum: 90 },
    bike: { base: 20, perKm: 8, perMinute: 1.5, minimum: 35 },
  };

  const activeRideCounts = await rideModel.aggregate([
    {
      $match: {
        status: { $in: ["pending", "accepted", "ongoing"] },
      },
    },
    {
      $group: {
        _id: "$vehicle",
        count: { $sum: 1 },
      },
    },
  ]);

  const activeRideCountByVehicle = activeRideCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const fare = {};
  const fareDetails = {};

  await Promise.all(
    Object.entries(pricing).map(async ([vehicleType, rate]) => {
      const activeRides = activeRideCountByVehicle[vehicleType] || 0;
      const onlineCaptains = await captainModel.countDocuments({
        socketId: { $exists: true, $ne: "" },
        "vehicle.type": vehicleType,
      });
      const demandRatio = activeRides / Math.max(onlineCaptains, 1);
      const crowdMultiplier = Math.min(2.2, 1 + demandRatio * 0.18);
      const rawFare =
        rate.base + distanceKm * rate.perKm + durationMinutes * rate.perMinute;
      const calculatedFare = Math.max(rate.minimum, rawFare) * crowdMultiplier;

      fare[vehicleType] = Math.round(calculatedFare);
      fareDetails[vehicleType] = {
        baseFare: rate.base,
        distanceCharge: Math.round(distanceKm * rate.perKm),
        timeCharge: Math.round(durationMinutes * rate.perMinute),
        minimumFare: rate.minimum,
        crowdMultiplier: Number(crowdMultiplier.toFixed(2)),
        activeRides,
        onlineCaptains,
      };
    })
  );

  return { fare, distanceTime, fareDetails };
};

module.exports.getFare = getFare;

function getOtp(num) {
  function generateOtp(num) {
    const otp = crypto
      .randomInt(Math.pow(10, num - 1), Math.pow(10, num))
      .toString();
    return otp;
  }
  return generateOtp(num);
}

module.exports.createRide = async ({
  user,
  pickup,
  destination,
  vehicleType,
  paymentMethod = "cash",
  paymentDetails = {},
}) => {
  if (!user || !pickup || !destination || !vehicleType) {
    throw new Error("All fields are required");
  }

  try {
    const { fare, distanceTime } = await getFare(pickup, destination);

    const ride = rideModel.create({
      user,
      pickup,
      destination,
      otp: getOtp(6),
      fare: fare[vehicleType],
      vehicle: vehicleType,
      distance: distanceTime.distance.value,
      duration: distanceTime.duration.value,
      paymentMethod,
      paymentStatus: "pending",
      paymentID: paymentDetails.paymentId,
      orderId: paymentDetails.orderId,
      signature: paymentDetails.signature,
    });

    return ride;
  } catch (error) {
    throw new Error("Error occured while creating ride.");
  }
};

// when ride request is accepted by captain
module.exports.confirmRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  try {
    await rideModel.findOneAndUpdate(
      {
        _id: rideId,
      },
      {
        status: "accepted",
        captain: captain._id,
      }
    );

    const captainData = await captainModel.findOne({ _id: captain._id });

    captainData.rides.push(rideId);

    await captainData.save();

    const ride = await rideModel
      .findOne({
        _id: rideId,
      })
      .populate("user")
      .populate("captain")
      .select("+otp");

    if (!ride) {
      throw new Error("Ride not found");
    }

    return ride;
  } catch (error) {
    console.log(error)
    throw new Error("Error occured while confirming ride.");
  }
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
  if (!rideId || !otp) {
    throw new Error("Ride id and OTP are required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
    })
    .populate("user")
    .populate("captain")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "accepted") {
    throw new Error("Ride not accepted");
  }

  if (ride.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "ongoing",
    }
  );

  return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
      captain: captain._id,
    })
    .populate("user")
    .populate("captain")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (!["accepted", "ongoing"].includes(ride.status)) {
    throw new Error(`Ride cannot be ended from ${ride.status} status`);
  }

  const completedRide = await rideModel
    .findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "completed",
    },
    { new: true }
  )
    .populate("user")
    .populate("captain")
    .select("+otp");

  return completedRide;
};
