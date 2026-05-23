import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  ChevronDown,
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

  return (
    <>
      <div
        className={`${
          showPanel ? "bottom-0" : "-bottom-[85%]"
        } absolute inset-x-0 z-10 w-full rounded-t-2xl border border-dark-200 bg-white/98 p-5 pt-2 shadow-card-xl backdrop-blur-md transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[30rem] sm:rounded-xl ${showPanel ? "sm:translate-y-0" : "sm:translate-y-[calc(100%+3rem)]"}`}
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
                <span className="mt-2 inline-flex items-center justify-center bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-glow-primary">
                  OTP: {confirmedRideData?.otp}
                </span>
              </div>
            )}
          </div>
          {confirmedRideData?._id && (
            <div className="flex gap-2 mb-4">
              <Button
                type={"link"}
                path={`/user/chat/${confirmedRideData?._id}`}
                title={"Message"}
                icon={<SendHorizontal strokeWidth={1.5} size={18} />}
                variant="secondary"
                classes={"flex-1"}
              />
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors">
                <a href={"tel:" + confirmedRideData?.captain?.phone}>
                  <PhoneCall size={20} strokeWidth={2} className="text-primary-600" />
                </a>
              </div>
            </div>
          )}
          <div className="mb-4 space-y-2">
            {/* Pickup Location */}
            <div className="flex items-start gap-3 border-l-4 border-primary-500 py-3 px-3 bg-primary-50 rounded-lg">
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
            <div className="flex items-start gap-3 border-l-4 border-dark-400 py-3 px-3 bg-dark-50 rounded-lg">
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
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 py-3 px-3 rounded-lg">
              <CreditCard size={20} className="text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-dark-500">Estimated Fare</p>
                <h1 className="text-xl font-bold text-primary-600">₹ {fare[selectedVehicle]}</h1>
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
                className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${
                  paymentMethod === "cash"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-dark-200 bg-white text-dark-700 hover:bg-dark-50"
                }`}
              >
                Pay Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${
                  paymentMethod === "razorpay"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-dark-200 bg-white text-dark-700 hover:bg-dark-50"
                }`}
              >
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
