const axios = require("axios");
const captainModel = require("../models/captain.model");

const isPlaceholder = (value) => !value || value.includes("<") || value.includes(">");
const hasGoogleMapsApiKey = () => !isPlaceholder(process.env.GOOGLE_MAPS_API);

const getMockDistanceTime = (origin, destination) => {
  const seed = `${origin}-${destination}`.length;
  const distanceKm = Math.max(2, Math.min(35, seed % 34));
  const durationMinutes = Math.max(8, Math.round(distanceKm * 3.2));

  return {
    distance: {
      text: `${distanceKm} km`,
      value: distanceKm * 1000,
    },
    duration: {
      text: `${durationMinutes} mins`,
      value: durationMinutes * 60,
    },
    status: "OK",
  };
};

const getMockCoordinate = (address) => {
  const coordinateMatch = String(address)
    .trim()
    .match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);

  if (coordinateMatch) {
    return {
      ltd: Number(coordinateMatch[1]),
      lng: Number(coordinateMatch[3]),
    };
  }

  const seed = address.length;
  return {
    ltd: 28.6139 + (seed % 20) / 1000,
    lng: 77.209 + (seed % 15) / 1000,
  };
};

module.exports.getAddressFromCoordinate = async (ltd, lng) => {
  if (!ltd || !lng) {
    throw new Error("Latitude and longitude are required");
  }

  const apiKey = process.env.GOOGLE_MAPS_API;

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return `Current Location (${Number(ltd).toFixed(5)}, ${Number(lng).toFixed(5)})`;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
    `${ltd},${lng}`
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);

    if (response.data.status === "OK" && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google reverse geocoding unavailable:", response.data.status);
      return `Current Location (${Number(ltd).toFixed(5)}, ${Number(lng).toFixed(5)})`;
    }

    throw new Error("Unable to fetch address");
  } catch (error) {
    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google reverse geocoding failed, using fallback address:", error.message);
      return `Current Location (${Number(ltd).toFixed(5)}, ${Number(lng).toFixed(5)})`;
    }

    console.error(error);
    throw error;
  }
};

module.exports.getAddressCoordinate = async (address) => {
  const apiKey = process.env.GOOGLE_MAPS_API;

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return getMockCoordinate(address);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return {
        ltd: location.lat,
        lng: location.lng,
      };
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google geocoding unavailable:", response.data.status);
      return getMockCoordinate(address);
    }

    throw new Error("Unable to fetch coordinates");
  } catch (error) {
    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google geocoding failed, using fallback coordinates:", error.message);
      return getMockCoordinate(address);
    }

    console.error(error);
    throw error;
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }
  const apiKey = process.env.GOOGLE_MAPS_API;

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return getMockDistanceTime(origin, destination);
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") {
        if (process.env.ENVIRONMENT !== "production") {
          console.warn("Google distance matrix found no route, using fallback distance.");
          return getMockDistanceTime(origin, destination);
        }

        throw new Error("No routes found");
      }

      return response.data.rows[0].elements[0];
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google distance matrix unavailable:", response.data.status);
      return getMockDistanceTime(origin, destination);
    }

    throw new Error("Unable to fetch distance and time");
  } catch (err) {
    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google distance matrix failed, using fallback distance:", err.message);
      return getMockDistanceTime(origin, destination);
    }

    console.error(err);
    throw err;
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error("query is required");
  }

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return [
      `${input}, Connaught Place, New Delhi`,
      `${input}, India Gate, New Delhi`,
      `${input}, Karol Bagh, New Delhi`,
      `${input}, Saket, New Delhi`,
      `${input}, Noida Sector 18`,
    ];
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      return response.data.predictions
        .map((prediction) => prediction.description)
        .filter((value) => value);
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google Places suggestions unavailable:", response.data.status);
      return [
        `${input}, Connaught Place, New Delhi`,
        `${input}, India Gate, New Delhi`,
        `${input}, Karol Bagh, New Delhi`,
        `${input}, Saket, New Delhi`,
        `${input}, Noida Sector 18`,
      ];
    }

    throw new Error("Unable to fetch suggestions");
  } catch (err) {
    if (process.env.ENVIRONMENT !== "production") {
      return [
        `${input}, Connaught Place, New Delhi`,
        `${input}, India Gate, New Delhi`,
        `${input}, Karol Bagh, New Delhi`,
        `${input}, Saket, New Delhi`,
        `${input}, Noida Sector 18`,
      ];
    }

    console.log(err.message);
    throw err;
  }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {
  // radius in km
  
  try {
    const captains = await captainModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, ltd], radius / 6371],
        },
      },
      "vehicle.type": vehicleType,
    });
    return captains;
  } catch (error) {
    throw new Error("Error in getting captain in radius: " + error.message);
  }
};

module.exports.getOnlineCaptainsByVehicle = async (vehicleType) => {
  try {
    return await captainModel.find({
      socketId: { $exists: true, $ne: "" },
      "vehicle.type": vehicleType,
    });
  } catch (error) {
    throw new Error("Error in getting online captains: " + error.message);
  }
};
