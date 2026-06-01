const axios = require("axios");
const captainModel = require("../models/captain.model");
const { getCacheValue, setCacheValue } = require("../utils/ttl-cache");

const isPlaceholder = (value) => !value || value.includes("<") || value.includes(">");
const hasGoogleMapsApiKey = () => !isPlaceholder(process.env.GOOGLE_MAPS_API);
const CACHE_TTL = {
  suggestions: 5 * 60 * 1000,
  geocode: 30 * 60 * 1000,
  distance: 10 * 60 * 1000,
};

const normalizeCacheKey = (value) => String(value || "").trim().toLowerCase();

const fallbackPlaces = [
  { name: "Connaught Place, New Delhi, Delhi, India", ltd: 28.6315, lng: 77.2167 },
  { name: "Civil Lines, Prayagraj, Uttar Pradesh, India", ltd: 25.4576, lng: 81.8446 },
  { name: "Gorakhnath, Gorakhpur, Uttar Pradesh, India", ltd: 26.7828, lng: 83.3734 },
  { name: "India Gate, New Delhi, Delhi, India", ltd: 28.6129, lng: 77.2295 },
  { name: "Karol Bagh, New Delhi, Delhi, India", ltd: 28.6518, lng: 77.1909 },
  { name: "Saket, New Delhi, Delhi, India", ltd: 28.5245, lng: 77.2066 },
  { name: "Noida Sector 18, Noida, Uttar Pradesh, India", ltd: 28.5708, lng: 77.3261 },
  { name: "Cyber City, Gurugram, Haryana, India", ltd: 28.495, lng: 77.0887 },
  { name: "Rajiv Chowk Metro Station, New Delhi, Delhi, India", ltd: 28.6328, lng: 77.2197 },
  { name: "New Delhi Railway Station, New Delhi, Delhi, India", ltd: 28.6429, lng: 77.2198 },
  { name: "Indira Gandhi International Airport, New Delhi, Delhi, India", ltd: 28.5562, lng: 77.1 },
  { name: "Huda City Centre, Gurugram, Haryana, India", ltd: 28.4595, lng: 77.0727 },
  { name: "Marine Drive, Mumbai, Maharashtra, India", ltd: 18.9432, lng: 72.8238 },
  { name: "Bandra Kurla Complex, Mumbai, Maharashtra, India", ltd: 19.0676, lng: 72.8674 },
  { name: "Andheri West, Mumbai, Maharashtra, India", ltd: 19.1363, lng: 72.8277 },
  { name: "Koramangala, Bengaluru, Karnataka, India", ltd: 12.9352, lng: 77.6245 },
  { name: "Indiranagar, Bengaluru, Karnataka, India", ltd: 12.9784, lng: 77.6408 },
  { name: "MG Road, Bengaluru, Karnataka, India", ltd: 12.9756, lng: 77.6055 },
  { name: "Banjara Hills, Hyderabad, Telangana, India", ltd: 17.4126, lng: 78.4482 },
  { name: "HITEC City, Hyderabad, Telangana, India", ltd: 17.4435, lng: 78.3772 },
  { name: "Park Street, Kolkata, West Bengal, India", ltd: 22.5535, lng: 88.3525 },
  { name: "T Nagar, Chennai, Tamil Nadu, India", ltd: 13.0418, lng: 80.2341 },
  { name: "Koregaon Park, Pune, Maharashtra, India", ltd: 18.5362, lng: 73.8938 },
  { name: "Vaishali Nagar, Jaipur, Rajasthan, India", ltd: 26.9124, lng: 75.7439 },
];

const toRad = (degrees) => (degrees * Math.PI) / 180;

const getStraightLineDistanceKm = (origin, destination) => {
  const earthRadiusKm = 6371;
  const latDistance = toRad(destination.ltd - origin.ltd);
  const lngDistance = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRad(origin.ltd)) *
      Math.cos(toRad(destination.ltd)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const formatDistance = (distanceKm) => {
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  return `${Math.round(distanceKm)} km`;
};

const getFallbackDistanceTimeFromCoordinates = (origin, destination) => {
  const straightLineKm = getStraightLineDistanceKm(origin, destination);
  const roadDistanceKm = Math.max(1, straightLineKm * 1.28);
  const durationMinutes = Math.max(5, Math.round((roadDistanceKm / 24) * 60));

  return {
    distance: {
      text: formatDistance(roadDistanceKm),
      value: Math.round(roadDistanceKm * 1000),
    },
    duration: {
      text: `${durationMinutes} mins`,
      value: durationMinutes * 60,
    },
    status: "OK",
    source: "estimated",
  };
};

const getMockCoordinate = (address) => {
  const normalizedAddress = String(address).trim().toLowerCase();
  const coordinateMatch = String(address)
    .trim()
    .match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);

  if (coordinateMatch) {
    return {
      ltd: Number(coordinateMatch[1]),
      lng: Number(coordinateMatch[3]),
    };
  }

  const matchedPlace = fallbackPlaces.find((place) => {
    const normalizedPlace = place.name.toLowerCase();
    return normalizedPlace.includes(normalizedAddress) || normalizedAddress.includes(normalizedPlace.split(",")[0]);
  });

  if (matchedPlace) {
    return {
      ltd: matchedPlace.ltd,
      lng: matchedPlace.lng,
    };
  }

  const seed = normalizedAddress.length;
  return {
    ltd: 28.6139 + (seed % 20) / 1000,
    lng: 77.209 + (seed % 15) / 1000,
  };
};

const getMockCoordinateNearBias = (address, biasCoordinate) => {
  const normalizedAddress = String(address).trim().toLowerCase();
  const matchedPlace = fallbackPlaces.find((place) => {
    const normalizedPlace = place.name.toLowerCase();
    return normalizedPlace.includes(normalizedAddress) || normalizedAddress.includes(normalizedPlace.split(",")[0]);
  });

  if (matchedPlace) {
    return {
      ltd: matchedPlace.ltd,
      lng: matchedPlace.lng,
    };
  }

  const seed = normalizedAddress.length || 1;
  return {
    ltd: biasCoordinate.ltd + ((seed % 9) + 2) / 100,
    lng: biasCoordinate.lng + ((seed % 7) + 2) / 100,
  };
};

const getFallbackSuggestions = (input) => {
  const normalizedInput = String(input).trim().toLowerCase();
  return fallbackPlaces
    .filter((place) => place.name.toLowerCase().includes(normalizedInput))
    .map((place) => place.name)
    .slice(0, 8);
};

const parseCoordinateText = (value) => {
  const coordinateMatch = String(value)
    .trim()
    .match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);

  if (!coordinateMatch) {
    return null;
  }

  return {
    ltd: Number(coordinateMatch[1]),
    lng: Number(coordinateMatch[3]),
  };
};

const formatCoordinate = ({ ltd, lng }) => `${ltd},${lng}`;

const getBoundsAroundCoordinate = ({ ltd, lng }, delta = 0.35) =>
  `${ltd - delta},${lng - delta}|${ltd + delta},${lng + delta}`;

const resolveBiasCoordinate = async (bias) => {
  if (!bias) {
    return null;
  }

  const coordinate = parseCoordinateText(bias);
  if (coordinate) {
    return coordinate;
  }

  try {
    return await module.exports.getAddressCoordinate(bias);
  } catch (error) {
    if (process.env.ENVIRONMENT !== "production") {
      return getMockCoordinate(bias);
    }

    return null;
  }
};

module.exports.getAddressFromCoordinate = async (ltd, lng) => {
  if (!ltd || !lng) {
    throw new Error("Latitude and longitude are required");
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const cacheKey = `${Number(ltd).toFixed(5)},${Number(lng).toFixed(5)}`;
  const cachedAddress = getCacheValue("reverse-geocode", cacheKey);

  if (cachedAddress) {
    return cachedAddress;
  }

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return `Current Location (${Number(ltd).toFixed(5)}, ${Number(lng).toFixed(5)})`;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
    `${ltd},${lng}`
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);

    if (response.data.status === "OK" && response.data.results.length > 0) {
      return setCacheValue(
        "reverse-geocode",
        cacheKey,
        response.data.results[0].formatted_address,
        CACHE_TTL.geocode
      );
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

module.exports.getAddressCoordinate = async (address, biasCoordinate = null) => {
  const apiKey = process.env.GOOGLE_MAPS_API;
  const directCoordinate = parseCoordinateText(address);

  if (directCoordinate) {
    return directCoordinate;
  }

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    if (biasCoordinate) {
      return getMockCoordinateNearBias(address, biasCoordinate);
    }

    return getMockCoordinate(address);
  }

  const cacheKey = `${normalizeCacheKey(address)}:${biasCoordinate ? formatCoordinate(biasCoordinate) : "global"}`;
  const cachedCoordinate = getCacheValue("geocode", cacheKey);

  if (cachedCoordinate) {
    return cachedCoordinate;
  }

  const bounds = biasCoordinate
    ? `&bounds=${encodeURIComponent(getBoundsAroundCoordinate(biasCoordinate))}`
    : "";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&components=country:IN&region=in${bounds}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return setCacheValue("geocode", cacheKey, {
        ltd: location.lat,
        lng: location.lng,
      }, CACHE_TTL.geocode);
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google geocoding unavailable:", response.data.status);
      if (biasCoordinate) {
        return setCacheValue(
          "geocode",
          cacheKey,
          getMockCoordinateNearBias(address, biasCoordinate),
          CACHE_TTL.suggestions
        );
      }

      return setCacheValue("geocode", cacheKey, getMockCoordinate(address), CACHE_TTL.suggestions);
    }

    throw new Error("Unable to fetch coordinates");
  } catch (error) {
    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google geocoding failed, using fallback coordinates:", error.message);
      if (biasCoordinate) {
        return setCacheValue(
          "geocode",
          cacheKey,
          getMockCoordinateNearBias(address, biasCoordinate),
          CACHE_TTL.suggestions
        );
      }

      return setCacheValue("geocode", cacheKey, getMockCoordinate(address), CACHE_TTL.suggestions);
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

  const originCoordinates = await module.exports.getAddressCoordinate(origin);
  const destinationCoordinates = await module.exports.getAddressCoordinate(destination, originCoordinates);
  const distanceCacheKey = `${formatCoordinate(originCoordinates)}:${formatCoordinate(destinationCoordinates)}`;
  const cachedDistance = getCacheValue("distance-time", distanceCacheKey);

  if (cachedDistance) {
    return { ...cachedDistance, cacheStatus: "hit" };
  }

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return setCacheValue(
      "distance-time",
      distanceCacheKey,
      getFallbackDistanceTimeFromCoordinates(originCoordinates, destinationCoordinates),
      CACHE_TTL.distance
    );
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    formatCoordinate(originCoordinates)
  )}&destinations=${encodeURIComponent(formatCoordinate(destinationCoordinates))}&mode=driving&units=metric&region=in&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const element = response.data.rows?.[0]?.elements?.[0];

      if (!element || element.status !== "OK") {
        if (process.env.ENVIRONMENT !== "production") {
          console.warn("Google distance matrix found no route, using estimated distance.");
          return setCacheValue(
            "distance-time",
            distanceCacheKey,
            getFallbackDistanceTimeFromCoordinates(originCoordinates, destinationCoordinates),
            CACHE_TTL.suggestions
          );
        }

        throw new Error("No routes found");
      }

      return setCacheValue(
        "distance-time",
        distanceCacheKey,
        { ...element, source: "google", cacheStatus: "miss" },
        CACHE_TTL.distance
      );
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google distance matrix unavailable:", response.data.status);
      return setCacheValue(
        "distance-time",
        distanceCacheKey,
        getFallbackDistanceTimeFromCoordinates(originCoordinates, destinationCoordinates),
        CACHE_TTL.suggestions
      );
    }

    throw new Error("Unable to fetch distance and time");
  } catch (err) {
    if (process.env.ENVIRONMENT !== "production") {
      console.warn("Google distance matrix failed, using estimated distance:", err.message);
      return setCacheValue(
        "distance-time",
        distanceCacheKey,
        getFallbackDistanceTimeFromCoordinates(originCoordinates, destinationCoordinates),
        CACHE_TTL.suggestions
      );
    }

    console.error(err);
    throw err;
  }
};

module.exports.getAutoCompleteSuggestions = async (input, bias) => {
  if (!input) {
    throw new Error("query is required");
  }

  if (!hasGoogleMapsApiKey() && process.env.ENVIRONMENT !== "production") {
    return getFallbackSuggestions(input);
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const biasCoordinate = await resolveBiasCoordinate(bias);
  const cacheKey = `${normalizeCacheKey(input)}:${biasCoordinate ? formatCoordinate(biasCoordinate) : "global"}`;
  const cachedSuggestions = getCacheValue("place-suggestions", cacheKey);

  if (cachedSuggestions) {
    return cachedSuggestions;
  }

  const locationParams = biasCoordinate
    ? `&location=${encodeURIComponent(formatCoordinate(biasCoordinate))}&radius=50000`
    : "";
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&components=country:in&types=geocode&language=en${locationParams}&key=${apiKey}`;
  const bounds = biasCoordinate
    ? `&bounds=${encodeURIComponent(getBoundsAroundCoordinate(biasCoordinate))}`
    : "";
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    input
  )}&components=country:IN&region=in${bounds}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      return setCacheValue("place-suggestions", cacheKey, response.data.predictions
        .map((prediction) => prediction.description)
        .filter((value) => value), CACHE_TTL.suggestions);
    }

    if (response.data.status === "ZERO_RESULTS") {
      return setCacheValue("place-suggestions", cacheKey, [], CACHE_TTL.suggestions);
    }

    const geocodeResponse = await axios.get(geocodeUrl);
    if (geocodeResponse.data.status === "OK") {
      return setCacheValue("place-suggestions", cacheKey, geocodeResponse.data.results
        .map((result) => result.formatted_address)
        .filter((value) => value)
        .slice(0, 8), CACHE_TTL.suggestions);
    }

    if (process.env.ENVIRONMENT !== "production") {
      console.warn(
        "Google Places suggestions unavailable:",
        response.data.status,
        response.data.error_message || ""
      );
      return setCacheValue("place-suggestions", cacheKey, getFallbackSuggestions(input), CACHE_TTL.suggestions);
    }

    throw new Error("Unable to fetch suggestions");
  } catch (err) {
    if (process.env.ENVIRONMENT !== "production") {
      return setCacheValue("place-suggestions", cacheKey, getFallbackSuggestions(input), CACHE_TTL.suggestions);
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
