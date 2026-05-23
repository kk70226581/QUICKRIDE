import { useCallback, useContext, useEffect, useState } from "react";
import map from "/map.png";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { Phone, User } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { AppNav, NewRide } from "../components";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";
import { getApiErrorMessage } from "../utils/apiError";

const defaultRideData = {
  user: {
    fullname: {
      firstname: "No",
      lastname: "User",
    },
    _id: "",
    email: "example@gmail.com",
    rides: [],
  },
  pickup: "Place, City, State, Country",
  destination: "Place, City, State, Country",
  fare: 0,
  vehicle: "car",
  status: "pending",
  duration: 0,
  distance: 0,
  _id: "123456789012345678901234",
};

function CaptainHomeScreen() {
  const token = localStorage.getItem("token");

  const { captain } = useCaptain();
  const { socket } = useContext(SocketDataContext);
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const [riderLocation, setRiderLocation] = useState({
    ltd: null,
    lng: null,
  });
  const [mapLocation, setMapLocation] = useState(
    `https://www.google.com/maps?q=${riderLocation.ltd},${riderLocation.lng}&output=embed`
  );
  const [earnings, setEarnings] = useState({
    today: 0,
    month: 0,
    lifetime: 0,
    paid: 0,
    pending: 0,
    cash: 0,
    online: 0,
    todayRides: 0,
    monthRides: 0,
    completedRides: 0,
  });

  const [rides, setRides] = useState({
    accepted: 0,
    cancelled: 0,
    distanceTravelled: 0,
  });
  const [newRide, setNewRide] = useState(
    JSON.parse(localStorage.getItem("rideDetails")) || defaultRideData
  );

  const [otp, setOtp] = useState("");
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [error, setError] = useState("");

  const fetchCaptainEarnings = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/captain/earnings`,
        {
          headers: {
            token,
          },
        }
      );

      setEarnings(response.data.earnings);
    } catch (error) {
      Console.log(error);
    }
  }, [token]);

  // Panels
  const [showCaptainDetailsPanel, setShowCaptainDetailsPanel] = useState(true);
  const [showNewRidePanel, setShowNewRidePanel] = useState(
    JSON.parse(localStorage.getItem("showPanel")) || false
  );
  const [showBtn, setShowBtn] = useState(
    JSON.parse(localStorage.getItem("showBtn")) || "accept"
  );

  const acceptRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/confirm`,
          { rideId: newRide._id },
          {
            headers: {
              token: token,
            },
          }
        );
        setLoading(false);
        setShowBtn("otp");
        setMapLocation(
          `https://www.google.com/maps?q=${riderLocation.ltd},${riderLocation.lng} to ${newRide.pickup}&output=embed`
        );
        Console.log(response);
      }
    } catch (error) {
      setLoading(false);
      showAlert('Some error occured', getApiErrorMessage(error), 'failure');
      Console.log(error.response);
      setTimeout(() => {
        clearRideData();
      }, 1000);
    }
  };

  const verifyOTP = async () => {
    try {
      if (newRide._id != "" && otp.length == 6) {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/ride/start-ride?rideId=${newRide._id}&otp=${otp}`,
          {
            headers: {
              token: token,
            },
          }
        );
        setMapLocation(
          `https://www.google.com/maps?q=${riderLocation.ltd},${riderLocation.lng} to ${newRide.destination}&output=embed`
        );
        setShowBtn("end-ride");
        setLoading(false);
        Console.log(response);
      }
    } catch (err) {
      setLoading(false);
      setError("Invalid OTP");
      Console.log(err);
    }
  };

  const endRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/end-ride`,
          {
            rideId: newRide._id,
          },
          {
            headers: {
              token: token,
            },
          }
        );
        setMapLocation(
          `https://www.google.com/maps?q=${riderLocation.ltd},${riderLocation.lng}&output=embed`
        );
        setShowBtn("accept");
        setLoading(false);
        setShowCaptainDetailsPanel(true);
        setShowNewRidePanel(false);
        setNewRide(defaultRideData);
        localStorage.removeItem("rideDetails");
        localStorage.removeItem("showPanel");
        fetchCaptainEarnings();
      }
    } catch (err) {
      setLoading(false);
      Console.log(err);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Console.log(position);
          setRiderLocation({
            ltd: position.coords.latitude,
            lng: position.coords.longitude,
          });

          setMapLocation(
            `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}&output=embed`
          );
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
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

  const clearRideData = () => {
    setShowBtn("accept");
    setLoading(false);
    setShowCaptainDetailsPanel(true);
    setShowNewRidePanel(false);
    setNewRide(defaultRideData);
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("showPanel");
  }

  useEffect(() => {
    if (!captain._id) return;

    const joinCaptainSocket = () => {
      socket.emit("join", {
        userId: captain._id,
        userType: "captain",
      });

      updateLocation();
    };

    joinCaptainSocket();
    socket.on("connect", joinCaptainSocket);

    return () => {
      socket.off("connect", joinCaptainSocket);
    };
  }, [socket, captain._id]);

  useEffect(() => {
    const handleNewRide = (data) => {
      Console.log("New Ride available:", data);
      setShowBtn("accept");
      setNewRide(data);
      setShowNewRidePanel(true);
    };

    const handleRideCancelled = (data) => {
      Console.log("Ride cancelled", data);
      updateLocation();
      clearRideData();
    };

    socket.on("new-ride", handleNewRide);
    socket.on("ride-cancelled", handleRideCancelled);

    return () => {
      socket.off("new-ride", handleNewRide);
      socket.off("ride-cancelled", handleRideCancelled);
    };
  }, [socket]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", newRide._id);

    socket.on("receiveMessage", async (msg) => {
      // Console.log("Received message: ", msg);
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("rideDetails", JSON.stringify(newRide));
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("showPanel", JSON.stringify(showNewRidePanel));
    localStorage.setItem("showBtn", JSON.stringify(showBtn));
  }, [showNewRidePanel, showBtn]);

  const calculateEarnings = () => {
    let Todaysearning = 0;
    let monthlyEarning = 0;
    let lifetimeEarning = 0;

    let acceptedRides = 0;
    let cancelledRides = 0;

    let distanceTravelled = 0;

    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    captain.rides.forEach((ride) => {
      if (ride.status == "completed") {
        acceptedRides++;
        distanceTravelled += ride.distance;
        lifetimeEarning += ride.fare;
      }
      if (ride.status == "cancelled") cancelledRides++;

      const rideDate = new Date(ride.updatedAt);

      const rideDateWithoutTime = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(),
        rideDate.getDate()
      );

      if (
        rideDateWithoutTime.getTime() === todayWithoutTime.getTime() &&
        ride.status === "completed"
      ) {
        Todaysearning += ride.fare;
      }

      if (rideDate >= startOfMonth && ride.status === "completed") {
        monthlyEarning += ride.fare;
      }
    });

    setEarnings((prev) => ({
      ...prev,
      today: prev.today || Todaysearning,
      month: prev.month || monthlyEarning,
      lifetime: prev.lifetime || lifetimeEarning,
      completedRides: prev.completedRides || acceptedRides,
    }));
    setRides({
      accepted: acceptedRides,
      cancelled: cancelledRides,
      distanceTravelled: Math.round(distanceTravelled / 1000),
    });
  };

  useEffect(() => {
    calculateEarnings();
  }, [captain]);

  useEffect(() => {
    fetchCaptainEarnings();
  }, [fetchCaptainEarnings]);

  useEffect(() => {
    if (mapLocation.ltd && mapLocation.lng) {
      Console.log(mapLocation);
    }
  }, [mapLocation]);

  useEffect(() => {
    if (socket.id) Console.log("socket id:", socket.id);
  }, [socket.id]);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-dark-100"
      style={{ backgroundImage: `url(${map})` }}
    >
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <AppNav overlay />
      <iframe
        src={mapLocation}
        className="map absolute inset-0 h-full w-full"
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>

      {showCaptainDetailsPanel && (
        <div className="absolute inset-x-0 bottom-0 flex h-fit w-full flex-col justify-start gap-3 rounded-t-2xl border border-dark-200 bg-white/98 p-5 shadow-card-xl backdrop-blur-md sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[32rem] sm:rounded-xl sm:p-6">
          {/* Driver details */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="select-none rounded-full w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                <h1 className="text-lg font-bold text-white">
                  {captain?.fullname?.firstname[0]}
                  {captain?.fullname?.lastname[0]}
                </h1>
              </div>

              <div>
                <h1 className="text-lg font-bold text-dark-900">
                  {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                </h1>
                <p className="text-xs flex items-center gap-1 text-dark-500 ">
                  <Phone size={14} />
                  {captain?.phone}
                </p>
              </div>
            </div>

            <div className="text-right bg-primary-50 px-3 py-2 rounded-lg border border-primary-100">
              <p className="text-xs text-dark-500 font-medium">Today's Earnings</p>
              <h1 className="font-bold text-primary-600 text-lg">Rs {earnings.today}</h1>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-dark-500">Month</p>
              <h2 className="text-base font-bold text-dark-900">Rs {earnings.month}</h2>
              <p className="text-[11px] text-dark-500">{earnings.monthRides || 0} rides</p>
            </div>
            <div className="rounded-lg border border-dark-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-dark-500">Lifetime</p>
              <h2 className="text-base font-bold text-dark-900">Rs {earnings.lifetime}</h2>
              <p className="text-[11px] text-dark-500">{earnings.completedRides || rides.accepted} trips</p>
            </div>
            <div className="rounded-lg border border-dark-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-dark-500">Pending</p>
              <h2 className="text-base font-bold text-dark-900">Rs {earnings.pending || 0}</h2>
              <p className="text-[11px] text-dark-500">cash/unpaid</p>
            </div>
          </div>

          {/* Ride details */}
          <div className="flex justify-around items-center p-4 rounded-xl bg-gradient-to-r from-dark-800 to-dark-900 shadow-card-lg">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold text-white mb-1">{rides?.accepted}</h1>
              <p className="text-xs text-dark-300 font-medium">
                Rides
                <br />
                Accepted
              </p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold text-white mb-1">{rides?.distanceTravelled}</h1>
              <p className="text-xs text-dark-300 font-medium">
                Km
                <br />
                Travelled
              </p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold text-white mb-1">{rides?.cancelled}</h1>
              <p className="text-xs text-dark-300 font-medium">
                Rides
                <br />
                Cancelled
              </p>
            </div>
          </div>

          {/* Car details */}
          <div className="flex justify-between items-center border-2 border-primary-200 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 shadow-card">
            <div>
              <h1 className="text-lg font-bold text-dark-900 tracking-tight">
                {captain?.vehicle?.number}
              </h1>
              <p className="text-xs text-dark-600 flex items-center gap-2 font-medium">
                <span className="capitalize">{captain?.vehicle?.color}</span>
                <span>•</span>
                <User size={14} strokeWidth={2.5} />
                <span>{captain?.vehicle?.capacity} Seater</span>
              </p>
            </div>

            <img
              className="h-16 scale-x-[-1] mix-blend-multiply"
              src={
                captain?.vehicle?.type == "car"
                  ? "/car.png"
                  : `/${captain.vehicle.type}.webp`
              }
              alt="Vehicle"
            />
          </div>
        </div>
      )}

      <NewRide
        rideData={newRide}
        otp={otp}
        setOtp={setOtp}
        showBtn={showBtn}
        showPanel={showNewRidePanel}
        setShowPanel={setShowNewRidePanel}
        showPreviousPanel={setShowCaptainDetailsPanel}
        loading={loading}
        acceptRide={acceptRide}
        verifyOTP={verifyOTP}
        endRide={endRide}
        error={error}
      />
    </div>
  );
}

export default CaptainHomeScreen;
