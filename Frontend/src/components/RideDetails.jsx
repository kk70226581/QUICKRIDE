import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  ChevronDown,
  Navigation,
  Share2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Button from "./Button";

function RideDetails({
  pickupLocation,
  destinationLocation,
  selectedVehicle,
  paymentMethod,
  setPaymentMethod,
  fare,
  fareDetails,
  distanceTime,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  createRide,
  cancelRide,
  loading,
  rideCreated,
  confirmedRideData,
  paymentDue,
  completePayment,
}) {
  const selectedFareDetails = fareDetails?.[selectedVehicle];
  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    pickupLocation
  )}&destination=${encodeURIComponent(destinationLocation)}`;

  const tripSummary = [
    "QuickRide trip",
    `Ride ID: ${confirmedRideData?._id || "pending"}`,
    `Pickup: ${pickupLocation}`,
    `Destination: ${destinationLocation}`,
    confirmedRideData?.captain
      ? `Captain: ${confirmedRideData.captain.fullname?.firstname || ""} ${confirmedRideData.captain.fullname?.lastname || ""}`.trim()
      : "",
    confirmedRideData?.captain?.vehicle
      ? `Vehicle: ${confirmedRideData.captain.vehicle.number} (${confirmedRideData.captain.vehicle.color} ${confirmedRideData.captain.vehicle.type})`
      : "",
    confirmedRideData?.otp ? `OTP: ${confirmedRideData.otp}` : "",
    `Route: ${routeUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const shareTrip = async () => {
    const copyTripSummary = async () => {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(tripSummary);
      }

      alert("Trip details copied.");
    };

    try {
      if (navigator.share) {
        await navigator.share({
          title: "QuickRide trip",
          text: tripSummary,
        });
        return;
      }

      await copyTripSummary();
    } catch {
      await copyTripSummary();
    }
  };

  const copyOtp = async () => {
    if (!confirmedRideData?.otp) return;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(String(confirmedRideData.otp));
    }
    alert("OTP copied.");
  };

  const rideSteps = [
    { label: "Confirm", active: true },
    { label: "Captain", active: Boolean(confirmedRideData) },
    { label: "Trip", active: Boolean(confirmedRideData?.status === "ongoing") },
    { label: "Pay", active: paymentDue },
  ];

  return (
    <>
      <div
        className={`${
          showPanel ? "bottom-0" : "-bottom-[85%]"
        } surface-panel absolute inset-x-0 z-10 max-h-[86dvh] w-full overflow-y-auto rounded-t-[1.35rem] p-5 pt-2 transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[30rem] sm:rounded-2xl ${showPanel ? "sm:translate-y-0" : "sm:translate-y-[calc(100%+3rem)]"}`}
      >
        <div
          onClick={() => {
            setShowPanel(false);
            showPreviousPanel(true);
          }}
          className="flex justify-center py-2 cursor-pointer"
        >
          <ChevronDown strokeWidth={2.5} className="text-dark-300" size={28} />
        </div>
        <div>
          {rideCreated && !confirmedRideData && (
            <>
              <h2 className="text-center font-semibold text-dark-700 mb-2">Finding nearby drivers...</h2>
              <div className="overflow-y-hidden py-2 pb-4">
                <div className="h-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 animate-pulse"></div>
              </div>
            </>
          )}
          <div className="mb-3 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-slate-500">
            {rideSteps.map((step) => (
              <div
                key={step.label}
                className={`rounded-lg border px-2 py-2 ${
                  step.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white"
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
          <div
            className={`flex ${
              confirmedRideData ? " justify-between items-center" : " justify-center "
            } pt-2 pb-4`}
          >
            <div>
              <img
                src={
                  selectedVehicle == "car"
                    ? "/car.png"
                    : `/${selectedVehicle}.webp`
                }
                className={`${confirmedRideData ? " h-20" : " h-14 "} mix-blend-multiply`}
              />
            </div>

            {confirmedRideData?._id && (
              <div className="leading-5 flex-1 ml-4">
                <h1 className="text-lg font-bold text-dark-900">
                  {confirmedRideData?.captain?.fullname?.firstname}{" "}
                  {confirmedRideData?.captain?.fullname?.lastname}
                </h1>
                <h2 className="font-semibold text-dark-600">
                  {confirmedRideData?.captain?.vehicle?.number}
                </h2>
                <p className="capitalize text-xs text-dark-500">
                  {confirmedRideData?.captain?.vehicle?.color}{" "}
                  {confirmedRideData?.captain?.vehicle?.type}
                </p>
                <button
                  type="button"
                  onClick={copyOtp}
                  title="Copy OTP"
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1 text-sm font-bold text-white shadow-glow-primary transition hover:from-primary-600 hover:to-primary-700"
                >
                  OTP: {confirmedRideData?.otp}
                </button>
              </div>
            )}
          </div>
          {confirmedRideData?._id && (
            <>
            <div className="flex gap-2 mb-3">
                <Button
                  type={"link"}
                  path={`/user/chat/${confirmedRideData?._id}`}
                  title={"Message"}
                  icon={<SendHorizontal strokeWidth={1.5} size={18} />}
                  variant="secondary"
                  classes={"flex-1"}
                />
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors">
                  <a href={"tel:" + confirmedRideData?.captain?.phone} title="Call captain">
                    <PhoneCall size={20} strokeWidth={2} className="text-primary-600" />
                  </a>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary-700" />
                  <h2 className="text-sm font-bold text-dark-900">Safety toolkit</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={shareTrip}
                    className="flex min-h-12 flex-col items-center justify-center rounded-lg border border-primary-100 bg-white px-2 py-2 text-xs font-bold text-dark-700 transition hover:border-primary-300"
                  >
                    <Share2 size={16} className="mb-1 text-primary-700" />
                    Share
                  </button>
                  <a
                    href="tel:112"
                    className="flex min-h-12 flex-col items-center justify-center rounded-lg border border-red-100 bg-white px-2 py-2 text-xs font-bold text-red-600 transition hover:border-red-300"
                  >
                    <PhoneCall size={16} className="mb-1" />
                    SOS
                  </a>
                  <a
                    href={routeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 flex-col items-center justify-center rounded-lg border border-dark-200 bg-white px-2 py-2 text-xs font-bold text-dark-700 transition hover:border-primary-300"
                  >
                    <Navigation size={16} className="mb-1 text-primary-700" />
                    Route
                  </a>
                </div>
              </div>
            </>
          )}
          <div className="mb-4 space-y-2">
            {/* Pickup Location */}
            <div className="flex items-start gap-3 border-l-4 border-emerald-500 py-3 px-3 bg-emerald-50 rounded-lg">
              <MapPinMinus size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-dark-900 leading-5 truncate">
                  {pickupLocation.split(", ")[0]}
                </h1>
                <p className="text-xs text-dark-500 truncate">
                  {pickupLocation.split(", ").slice(1).join(", ")}
                </p>
              </div>
            </div>

            {/* Destination Location */}
            <div className="flex items-start gap-3 border-l-4 border-slate-700 py-3 px-3 bg-slate-50 rounded-lg">
              <MapPinPlus size={20} className="text-dark-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-dark-900 leading-5 truncate">
                  {destinationLocation.split(", ")[0]}
                </h1>
                <p className="text-xs text-dark-500 truncate">
                  {destinationLocation.split(", ").slice(1).join(", ")}
                </p>
              </div>
            </div>

            {/* Fare */}
            <div className="surface-card flex items-center gap-3 rounded-xl px-3 py-3">
              <CreditCard size={20} className="text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-dark-500">Estimated Fare</p>
                <h1 className="text-xl font-bold text-primary-600">Rs {fare[selectedVehicle]}</h1>
                {distanceTime && selectedFareDetails && (
                  <p className="mt-1 text-[11px] font-semibold text-dark-500">
                    {distanceTime.distance?.text} | {distanceTime.duration?.text} | {selectedFareDetails.crowdMultiplier}x demand
                  </p>
                )}
              </div>
              <span className="text-xs bg-white text-dark-600 px-2 py-1 rounded font-semibold">
                {paymentMethod === "cash" ? "Cash" : "Online"}
              </span>
            </div>
          </div>
          {!rideCreated && !confirmedRideData && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-bold transition ${
                  paymentMethod === "cash"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-dark-200 bg-white text-dark-700 hover:bg-dark-50"
                }`}
              >
                <CreditCard size={17} />
                Pay Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-bold transition ${
                  paymentMethod === "razorpay"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-dark-200 bg-white text-dark-700 hover:bg-dark-50"
                }`}
              >
                <WalletCards size={17} />
                Pay Online Later
              </button>
            </div>
          )}
          {paymentDue ? (
            <Button
              title={"Pay Now"}
              loading={loading}
              loadingMessage={"Opening payment..."}
              variant="primary"
              fun={completePayment}
            />
          ) : rideCreated || confirmedRideData ? (
            <Button
              title={"Cancel Ride"}
              loading={loading}
              loadingMessage={"Cancelling..."}
              variant="danger"
              fun={cancelRide}
            />
          ) : (
            <Button 
              title={"Confirm Ride"} 
              fun={createRide} 
              loading={loading}
              loadingMessage={"Confirming..."}
              variant="primary"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default RideDetails;
