import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import map from "/map.png";
import {
  Button,
  LocationSuggestions,
  SelectVehicle,
  RideDetails,
  AppNav,
} from "../components";
import axios from "axios";
import debounce from "lodash.debounce";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import { getApiErrorMessage } from "../utils/apiError";
import { LocateFixed } from "lucide-react";

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

  // Panels
  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);

  const handleLocationChange = useCallback(
    debounce(async (inputValue, token) => {
      if (inputValue.length >= 3) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions`,
            {
              headers: {
                token: token,
              },
              params: {
                input: inputValue,
              },
            }
          );
          Console.log(response.data);
          setLocationSuggestion(response.data);
        } catch (error) {
          Console.error(error);
          setLocationSuggestion([
            `${inputValue}, Connaught Place, New Delhi`,
            `${inputValue}, India Gate, New Delhi`,
            `${inputValue}, Karol Bagh, New Delhi`,
            `${inputValue}, Saket, New Delhi`,
            `${inputValue}, Noida Sector 18`,
          ]);
        }
      }
    }, 700),
    []
  );

  const onChangeHandler = (e) => {
    setSelectedInput(e.target.id);
    const value = e.target.value;
    if (e.target.id == "pickup") {
      setPickupLocation(value);
    } else if (e.target.id == "destination") {
      setDestinationLocation(value);
    }

    handleLocationChange(value, token);

    if (e.target.value.length < 3) {
      setLocationSuggestion([]);
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

  // Get ride details
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
  }, [confirmedRideData]);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-dark-100"
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
      {/* Find a trip component */}
      {showFindTripPanel && (
        <div className="absolute inset-x-0 bottom-0 flex max-h-[68dvh] flex-col justify-start gap-4 overflow-hidden rounded-t-2xl border border-dark-200 bg-white/98 p-5 pb-4 shadow-card-xl backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:left-6 sm:top-28 sm:w-[28rem] sm:max-h-[calc(100dvh-8.5rem)] sm:rounded-xl sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">Where to?</h1>
          <div className="flex items-start relative w-full h-fit gap-4">
            <div className="flex flex-col items-center justify-start gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-glow-primary"></div>
              <div className="w-[2px] h-12 bg-gradient-to-b from-primary-400 to-transparent"></div>
              <div className="w-3 h-3 rounded-sm bg-dark-800"></div>
            </div>
            <div className="w-full flex-1">
              <div className="mb-3 flex gap-2">
                <input
                  id="pickup"
                  placeholder="Pick-up location"
                  className="min-w-0 flex-1 border-2 border-dark-200 bg-white px-4 py-3 rounded-lg outline-none text-sm shadow-card transition-all duration-200 truncate focus:border-primary-500 focus:shadow-card-lg"
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
                  className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg border-2 border-primary-200 bg-primary-50 text-primary-700 shadow-card transition hover:border-primary-400 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LocateFixed size={20} className={locationLoading ? "animate-pulse" : ""} />
                </button>
              </div>
              <input
                id="destination"
                placeholder="Drop-off location"
                className="w-full border-2 border-dark-200 bg-white px-4 py-3 rounded-lg outline-none text-sm shadow-card transition-all duration-200 truncate focus:border-primary-500 focus:shadow-card-lg"
                value={destinationLocation}
                onChange={onChangeHandler}
                autoComplete="off"
              />
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
