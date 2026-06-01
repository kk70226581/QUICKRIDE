import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import map from "/map.png";
import {
  Button,
  LocationSuggestions,
  SelectVehicle,
  RideDetails,
  AppNav,
  FavoriteRoutes,
} from "../components";
import axios from "axios";
import debounce from "lodash.debounce";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import { getApiErrorMessage } from "../utils/apiError";
import { Clock3, LocateFixed, Navigation, Shuffle, X } from "lucide-react";

function UserHomeScreen() {
  const token = localStorage.getItem("token"); // this token is in use
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [loading, setLoading] = useState(false);
  const [selectedInput, setSelectedInput] = useState("pickup");
  const [locationSuggestion, setLocationSuggestion] = useState([]);
  const [mapLocation, setMapLocation] = useState("");
  const [savedRoutes, setSavedRoutes] = useState(
    JSON.parse(localStorage.getItem("savedRoutes")) || []
  );
  const [recentRoutes, setRecentRoutes] = useState(
    JSON.parse(localStorage.getItem("recentRoutes")) || []
  );
  const [rideCreated, setRideCreated] = useState(false);
  const [tripError, setTripError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  // Ride details
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [fare, setFare] = useState({
    auto: 0,
    car: 0,
    bike: 0,
  });
  const [fareDetails, setFareDetails] = useState({});
  const [distanceTime, setDistanceTime] = useState(null);
  const [currentRideId, setCurrentRideId] = useState("");
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const [paymentDueRideId, setPaymentDueRideId] = useState("");
  const rideTimeout = useRef(null);
  const suggestionRequestId = useRef(0);

  // Panels
  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLocationChange = debounce(async (inputValue, token, requestId, biasLocation) => {
      const trimmedInput = inputValue.trim();
      const trimmedBias = biasLocation?.trim();

      if (trimmedInput.length >= 3) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions`,
            {
              headers: {
                token: token,
              },
              params: {
                input: trimmedInput,
                ...(trimmedBias && trimmedBias.length >= 3 ? { bias: trimmedBias } : {}),
              },
            }
          );
          Console.log(response.data);
          if (requestId === suggestionRequestId.current) {
            setLocationSuggestion(response.data);
          }
        } catch (error) {
          Console.error(error);
          if (requestId === suggestionRequestId.current) {
            setLocationSuggestion([]);
          }
        }
      }
    }, 700);

  const onChangeHandler = (e) => {
    setSelectedInput(e.target.id);
    const value = e.target.value;
    if (e.target.id == "pickup") {
      setPickupLocation(value);
    } else if (e.target.id == "destination") {
      setDestinationLocation(value);
    }

    suggestionRequestId.current += 1;
    handleLocationChange(
      value,
      token,
      suggestionRequestId.current,
      e.target.id === "destination" ? pickupLocation : ""
    );

    if (e.target.value.length < 3) {
      setLocationSuggestion([]);
      handleLocationChange.cancel();
    }
  };

  const getDistanceAndFare = async (pickupLocation, destinationLocation) => {
    Console.log(pickupLocation, destinationLocation);
    try {
      setLoading(true);
      setMapLocation(
        `https://www.google.com/maps?q=${pickupLocation} to ${destinationLocation}&output=embed`
      );
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/get-fare`,
        {
          headers: {
            token: token,
          },
          params: {
            pickup: pickupLocation,
            destination: destinationLocation,
          },
        }
      );
      Console.log(response);
      setFare(response.data.fare);
      setFareDetails(response.data.fareDetails || {});
      setDistanceTime(response.data.distanceTime || null);
      rememberRecentRoute(pickupLocation, destinationLocation);
      setTripError("");

      setShowFindTripPanel(false);
      setShowSelectVehiclePanel(true);
      setLocationSuggestion([]);
      setLoading(false);
    } catch (error) {
      Console.log(error);
      setTripError(getApiErrorMessage(error, "Unable to find rides for these locations."));
      setLoading(false);
    }
  };

  const rememberRecentRoute = (pickup, destination) => {
    const nextRoute = {
      id: `${pickup}-${destination}`.toLowerCase(),
      pickup,
      destination,
      label: `${pickup.split(",")[0]} to ${destination.split(",")[0]}`,
      createdAt: new Date().toISOString(),
    };
    const nextRoutes = [
      nextRoute,
      ...recentRoutes.filter((route) => route.id !== nextRoute.id),
    ].slice(0, 4);
    setRecentRoutes(nextRoutes);
    localStorage.setItem("recentRoutes", JSON.stringify(nextRoutes));
  };

  const handleSaveRoute = () => {
    if (!pickupLocation || !destinationLocation) return;

    const nextRoute = {
      id: Date.now().toString(),
      pickup: pickupLocation,
      destination: destinationLocation,
      label: `${pickupLocation.split(",")[0]} to ${destinationLocation.split(",")[0]}`,
      createdAt: new Date().toISOString(),
    };

    const exists = savedRoutes.some(
      (route) =>
        route.pickup === nextRoute.pickup && route.destination === nextRoute.destination
    );
    if (exists) return;

    const nextRoutes = [nextRoute, ...savedRoutes].slice(0, 6);
    setSavedRoutes(nextRoutes);
    localStorage.setItem("savedRoutes", JSON.stringify(nextRoutes));
  };

  const handleSelectSavedRoute = (route) => {
    setPickupLocation(route.pickup);
    setDestinationLocation(route.destination);
    setSelectedInput("pickup");
    setShowFindTripPanel(true);
    setShowSelectVehiclePanel(false);
    setShowRideDetailsPanel(false);
    navigate(`/home?pickup=${encodeURIComponent(route.pickup)}&destination=${encodeURIComponent(route.destination)}`);
  };

  const handleSwapLocations = () => {
    setPickupLocation(destinationLocation);
    setDestinationLocation(pickupLocation);
    setSelectedInput("destination");
    setTripError("");
  };

  const handleClearTripInputs = () => {
    setPickupLocation("");
    setDestinationLocation("");
    setLocationSuggestion([]);
    setTripError("");
    setMapLocation("");
  };

  const handleRemoveSavedRoute = (routeId) => {
    const nextRoutes = savedRoutes.filter((route) => route.id !== routeId);
    setSavedRoutes(nextRoutes);
    localStorage.setItem("savedRoutes", JSON.stringify(nextRoutes));
  };

  const handleClearSavedRoutes = () => {
    setSavedRoutes([]);
    localStorage.removeItem("savedRoutes");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setTripError("Current location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setTripError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setMapLocation(
          `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`
        );

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/map/get-address`,
            {
              headers: {
                token,
              },
              params: {
                ltd: latitude,
                lng: longitude,
              },
            }
          );

          setPickupLocation(
            response.data.address.startsWith("Current Location")
              ? `${latitude},${longitude}`
              : response.data.address
          );
          setSelectedInput("pickup");
        } catch (error) {
          setPickupLocation(`${latitude},${longitude}`);
          Console.log(error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        setTripError(
          error.code === error.PERMISSION_DENIED
            ? "Please allow location access to use current location."
            : "Unable to detect your current location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const createRide = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/create`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
          paymentMethod,
        },
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      const rideData = {
        pickup: pickupLocation,
        destination: destinationLocation,
        vehicleType: selectedVehicle,
        paymentMethod,
        fare: fare,
        fareDetails,
        distanceTime,
        confirmedRideData: confirmedRideData,
        _id: response.data._id,
      };
      setCurrentRideId(response.data._id);
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
      setLoading(false);
      setRideCreated(true);

      // Automatically cancel the ride after 1.5 minutes
      rideTimeout.current = setTimeout(() => {
        cancelRide();
      }, import.meta.env.VITE_RIDE_TIMEOUT);
      
    } catch (error) {
      Console.log(error);
      setTripError(getApiErrorMessage(error, "Unable to confirm this ride."));
      setLoading(false);
    }
  };

  const loadRazorpayCheckout = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
      document.body.appendChild(script);
    });

  const payWithRazorpay = async (rideId = currentRideId) => {
    const orderResponse = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/ride/payment/order`,
      rideId
        ? { rideId }
        : {
            pickup: pickupLocation,
            destination: destinationLocation,
            vehicleType: selectedVehicle,
          },
      {
        headers: {
          token,
        },
      }
    );

    const { order, amount } = orderResponse.data;

    if (order.devMode) {
      const confirmPayment = window.confirm(
        `Razorpay is not configured. Simulate successful payment of Rs ${amount}?`
      );

      if (!confirmPayment) {
        throw new Error("Payment cancelled");
      }

      const verifyResponse = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/payment/verify`,
        {
          rideId,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_dev_${Date.now()}`,
          razorpay_signature: "development_signature",
        },
        {
          headers: {
            token,
          },
        }
      );

      return verifyResponse.data.paymentDetails;
    }

    await loadRazorpayCheckout();

    const paymentResponse = await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "QuickRide",
        description: `${selectedVehicle} ride payment`,
        order_id: order.id,
        prefill: {
          name: `${user.fullname?.firstname || ""} ${user.fullname?.lastname || ""}`.trim(),
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: "#22c55e",
        },
        handler: resolve,
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled")),
        },
      });

      checkout.open();
    });

    const verifyResponse = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/ride/payment/verify`,
      {
        rideId,
        ...paymentResponse,
      },
      {
        headers: {
          token,
        },
      }
    );

    return verifyResponse.data.paymentDetails;
  };

  const finishRideLocally = () => {
    setShowRideDetailsPanel(false);
    setShowSelectVehiclePanel(false);
    setShowFindTripPanel(true);
    setDefaults();
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("panelDetails");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapLocation(
            `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}&output=embed`
          );
        },
        (error) => {
          console.error("Error fetching position:", error);
        }
      );
    }
  };

  const completePendingPayment = async (rideId = paymentDueRideId) => {
    if (!rideId) return;

    try {
      setLoading(true);
      setTripError("Ride completed. Please finish online payment.");
      await payWithRazorpay(rideId);
      setPaymentDueRideId("");
      setLoading(false);
      setTripError("");
      finishRideLocally();
    } catch (error) {
      setTripError(getApiErrorMessage(error, "Ride completed. Online payment was not completed."));
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    const rideDetails = JSON.parse(localStorage.getItem("rideDetails"));
    try {
      setLoading(true);
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel?rideId=${rideDetails._id || rideDetails.confirmedRideData._id
        }`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
        },
        {
          headers: {
            token: token,
          },
        }
      );
      setLoading(false);
      updateLocation();
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("messages");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };
  // Set ride details to default values
  const setDefaults = () => {
    setPickupLocation("");
    setDestinationLocation("");
    setSelectedVehicle("car");
    setPaymentMethod("cash");
    setFare({
      auto: 0,
      car: 0,
      bike: 0,
    });
    setFareDetails({});
    setDistanceTime(null);
    setConfirmedRideData(null);
    setCurrentRideId("");
    setPaymentDueRideId("");
    setRideCreated(false);
  };

  // Update Location
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapLocation(
            `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}&output=embed`
          );
        },
        (error) => {
          console.error("Error fetching position:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.error("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.error("The request to get user location timed out.");
              break;
            default:
              console.error("An unknown error occurred.");
          }
        }
      );
    }
  };

  // Update Location
  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    if (!user._id) return;

    const joinUserSocket = () => {
      socket.emit("join", {
        userId: user._id,
        userType: "user",
      });
    };

    joinUserSocket();
    socket.on("connect", joinUserSocket);

    return () => {
      socket.off("connect", joinUserSocket);
    };
  }, [socket, user._id]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const handleRideConfirmed = (data) => {
      Console.log("Clearing Timeout", rideTimeout);
      clearTimeout(rideTimeout.current);
      Console.log("Cleared Timeout");
      Console.log("Ride Confirmed");
      Console.log(data.captain.location);
      setMapLocation(
        `https://www.google.com/maps?q=${data.captain.location.coordinates[1]},${data.captain.location.coordinates[0]} to ${pickupLocation}&output=embed`
      );
      setConfirmedRideData(data);
    };

    const handleRideStarted = (data) => {
      Console.log("Ride started");
      setMapLocation(
        `https://www.google.com/maps?q=${data.pickup} to ${data.destination}&output=embed`
      );
    };

    const handleRideEnded = async (data) => {
      Console.log("Ride Ended");
      const endedRideId = data?._id || currentRideId || confirmedRideData?._id;
      const endedPaymentMethod = data?.paymentMethod || paymentMethod;

      if (endedPaymentMethod === "razorpay") {
        setPaymentDueRideId(endedRideId);
        await completePendingPayment(endedRideId);
        return;
      }

      setLoading(false);
      setTripError("");
      finishRideLocally();
    };

    socket.on("ride-confirmed", handleRideConfirmed);
    socket.on("ride-started", handleRideStarted);
    socket.on("ride-ended", handleRideEnded);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);
      socket.off("ride-started", handleRideStarted);
      socket.off("ride-ended", handleRideEnded);
    };
  }, [socket, pickupLocation, currentRideId, confirmedRideData, paymentMethod]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Get ride details
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const pickupParam = queryParams.get("pickup");
    const destinationParam = queryParams.get("destination");

    if (pickupParam) {
      setPickupLocation(pickupParam);
      setShowFindTripPanel(true);
    }
    if (destinationParam) {
      setDestinationLocation(destinationParam);
      setShowFindTripPanel(true);
    }
  }, [location.search]);

  useEffect(() => {
    const storedRideDetails = localStorage.getItem("rideDetails");
    const storedPanelDetails = localStorage.getItem("panelDetails");

    if (storedRideDetails) {
      const ride = JSON.parse(storedRideDetails);
      setPickupLocation(ride.pickup);
      setDestinationLocation(ride.destination);
      setSelectedVehicle(ride.vehicleType);
      setPaymentMethod(ride.paymentMethod || "cash");
      setFare(ride.fare);
      setFareDetails(ride.fareDetails || {});
      setDistanceTime(ride.distanceTime || null);
      setCurrentRideId(ride._id || ride.confirmedRideData?._id || "");
      setConfirmedRideData(ride.confirmedRideData);
    }

    if (storedPanelDetails) {
      const panels = JSON.parse(storedPanelDetails);
      setShowFindTripPanel(panels.showFindTripPanel);
      setShowSelectVehiclePanel(panels.showSelectVehiclePanel);
      setShowRideDetailsPanel(panels.showRideDetailsPanel);
    }
  }, []);

  // Store Ride Details
  useEffect(() => {
    const rideData = {
      _id: currentRideId,
      pickup: pickupLocation,
      destination: destinationLocation,
      vehicleType: selectedVehicle,
      paymentMethod,
      fare: fare,
      fareDetails,
      distanceTime,
      confirmedRideData: confirmedRideData,
    };
    localStorage.setItem("rideDetails", JSON.stringify(rideData));
  }, [
    pickupLocation,
    destinationLocation,
    selectedVehicle,
    paymentMethod,
    fare,
    fareDetails,
    distanceTime,
    currentRideId,
    confirmedRideData,
  ]);

  useEffect(() => {
    if (!rideCreated || confirmedRideData || !currentRideId) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/ride/status/${currentRideId}`,
          {
            headers: {
              token,
            },
          }
        );

        if (response.data.status === "accepted" && response.data.captain) {
          clearTimeout(rideTimeout.current);
          setConfirmedRideData(response.data);
        }
      } catch (error) {
        Console.log(error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [rideCreated, confirmedRideData, currentRideId, token]);

  // Store panel information
  useEffect(() => {
    const panelDetails = {
      showFindTripPanel,
      showSelectVehiclePanel,
      showRideDetailsPanel,
    };
    localStorage.setItem("panelDetails", JSON.stringify(panelDetails));
  }, [showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", confirmedRideData?._id);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [confirmedRideData, socket]);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-slate-100"
      style={{ backgroundImage: `url(${map})` }}
    >
      <AppNav overlay />
      <iframe
        src={mapLocation}
        className="map absolute inset-0 h-full w-full"
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
      <div className="map-scrim absolute inset-0" />
      {/* Find a trip component */}
      {showFindTripPanel && (
        <div className="surface-panel absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col justify-start gap-4 overflow-hidden rounded-t-[1.35rem] p-5 pb-4 sm:inset-x-auto sm:bottom-auto sm:left-6 sm:top-28 sm:w-[29rem] sm:max-h-[calc(100dvh-8.5rem)] sm:rounded-2xl sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-700">QuickRide live booking</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Where to?</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white/80 p-2 text-center text-[11px] font-bold text-slate-600">
            <div className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-800">Live fares</div>
            <div className="rounded-lg bg-sky-50 px-2 py-2 text-sky-800">Route ETA</div>
            <div className="rounded-lg bg-slate-100 px-2 py-2 text-slate-800">Safety tools</div>
          </div>
          <div className="soft-divider h-px" />
          <div className="flex items-start relative w-full h-fit gap-4">
            <div className="flex flex-col items-center justify-start gap-2 mt-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]"></div>
              <div className="h-12 w-[2px] bg-gradient-to-b from-emerald-400 to-slate-300"></div>
              <div className="h-3 w-3 rounded-sm bg-slate-900"></div>
            </div>
            <div className="w-full flex-1">
              <div className="mb-3 flex gap-2">
                <input
                  id="pickup"
                  placeholder="Pick-up location"
                  className="field-control min-w-0 flex-1 rounded-lg px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 truncate"
                  value={pickupLocation}
                  onChange={onChangeHandler}
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label="Use current location"
                  title="Use current location"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                  className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_12px_26px_rgba(16,185,129,0.14)] transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LocateFixed size={20} className={locationLoading ? "animate-pulse" : ""} />
                </button>
              </div>
              <input
                id="destination"
                placeholder="Drop-off location"
                className="field-control w-full rounded-lg px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 truncate"
                value={destinationLocation}
                onChange={onChangeHandler}
                autoComplete="off"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  disabled={!pickupLocation || !destinationLocation}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Shuffle size={15} />
                  Swap
                </button>
                <button
                  type="button"
                  onClick={handleClearTripInputs}
                  disabled={!pickupLocation && !destinationLocation}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={15} />
                  Clear
                </button>
              </div>
            </div>
          </div>
          {pickupLocation.length > 2 && destinationLocation.length > 2 && (
            <Button
              title={"Search Rides"}
              loading={loading}
              loadingMessage={"Finding..."}
              variant="primary"
              fun={() => {
                getDistanceAndFare(pickupLocation, destinationLocation);
              }}
            />
          )}
          {tripError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {tripError}
            </div>
          )}

          {recentRoutes.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white/82 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                  <Clock3 size={14} />
                  Recent searches
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRecentRoutes([]);
                    localStorage.removeItem("recentRoutes");
                  }}
                  className="text-xs font-bold text-slate-400 transition hover:text-red-600"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentRoutes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => handleSelectSavedRoute(route)}
                    className="inline-flex min-w-[11rem] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-white"
                  >
                    <Navigation size={14} className="shrink-0 text-emerald-700" />
                    <span className="truncate">{route.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <FavoriteRoutes
              routes={savedRoutes}
              onSelect={handleSelectSavedRoute}
              onRemove={handleRemoveSavedRoute}
              onClear={handleClearSavedRoutes}
              onSave={handleSaveRoute}
              currentRoute={{ pickup: pickupLocation, destination: destinationLocation }}
            />
          </div>

          <div className="w-full min-h-0 overflow-y-auto">
            {locationSuggestion.length > 0 && (
              <LocationSuggestions
                suggestions={locationSuggestion}
                setSuggestions={setLocationSuggestion}
                setPickupLocation={setPickupLocation}
                setDestinationLocation={setDestinationLocation}
                input={selectedInput}
              />
            )}
          </div>
        </div>
      )}

      {/* Select Vehicle Panel */}
      <SelectVehicle
        selectedVehicle={setSelectedVehicle}
        showPanel={showSelectVehiclePanel}
        setShowPanel={setShowSelectVehiclePanel}
        showPreviousPanel={setShowFindTripPanel}
        showNextPanel={setShowRideDetailsPanel}
        fare={fare}
        fareDetails={fareDetails}
        distanceTime={distanceTime}
      />

      {/* Ride Details Panel */}
      <RideDetails
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        selectedVehicle={selectedVehicle}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        fare={fare}
        fareDetails={fareDetails}
        distanceTime={distanceTime}
        showPanel={showRideDetailsPanel}
        setShowPanel={setShowRideDetailsPanel}
        showPreviousPanel={setShowSelectVehiclePanel}
        createRide={createRide}
        cancelRide={cancelRide}
        loading={loading}
        rideCreated={rideCreated}
        confirmedRideData={confirmedRideData}
        paymentDue={Boolean(paymentDueRideId)}
        completePayment={() => completePendingPayment(paymentDueRideId)}
      />
    </div>
  );
}

export default UserHomeScreen;
