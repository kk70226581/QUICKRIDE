import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  ChevronDown,
} from "lucide-react";
import Button from "./Button";

function NewRide({
  rideData,
  otp,
  setOtp,
  showBtn,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  loading,
  acceptRide,
  endRide,
  verifyOTP,
  error,
}) {
  const ignoreRide = () => {
    setShowPanel(false);
    showPreviousPanel(true);
  };

  return (
    <>
      <div
        className={`${
          showPanel ? "bottom-0" : "-bottom-[85%]"
        } absolute inset-x-0 z-10 w-full rounded-t-2xl border border-dark-200 bg-white/98 p-5 pt-2 shadow-card-xl backdrop-blur-md transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[32rem] sm:rounded-xl ${showPanel ? "sm:translate-y-0" : "sm:translate-y-[calc(100%+3rem)]"}`}
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
          <div className="flex justify-between items-start pb-4">
            <div className="flex items-center gap-4">
              <div className="select-none rounded-full w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                <h1 className="text-lg font-bold text-white">
                  {rideData?.user?.fullname?.firstname[0]}
                  {rideData?.user?.fullname?.lastname[0]}
                </h1>
              </div>

              <div>
                <h1 className="text-lg font-bold text-dark-900">
                  {rideData?.user?.fullname?.firstname}{" "}
                  {rideData?.user?.fullname?.lastname}
                </h1>
                <p className="text-xs text-dark-500 ">
                  {rideData?.user?.phone || rideData?.user?.email}
                </p>
              </div>
            </div>

            <div className="text-right bg-primary-50 px-3 py-2 rounded-lg border border-primary-100">
              <h1 className="font-bold text-primary-600 text-lg">₹ {rideData?.fare}</h1>
              <p className="text-xs text-dark-500 font-medium">
                {(Number(rideData?.distance?.toFixed(2)) / 1000)?.toFixed(1)} Km
              </p>
            </div>
          </div>

          {/* Message and call */}
          {showBtn != "accept" && (
            <div className="flex gap-2 mb-4">
              <Button
                type={"link"}
                path={`/captain/chat/${rideData?._id}`}
                title={"Message"}
                icon={<SendHorizontal strokeWidth={1.5} size={18} />}
                variant="secondary"
                classes={"flex-1"}
              />
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors">
                <a href={"tel:" + rideData?.user?.phone}>
                  <PhoneCall size={20} strokeWidth={2} className="text-primary-600" />
                </a>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {/* Pickup Location */}
            <div className="flex items-start gap-3 border-l-4 border-primary-500 py-3 px-3 bg-primary-50 rounded-lg">
              <MapPinMinus size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-dark-900 leading-5 truncate">
                  {rideData.pickup.split(", ")[0]}
                </h1>
                <p className="text-xs text-dark-500 truncate">
                  {rideData.pickup.split(", ").slice(1).join(", ")}
                </p>
              </div>
            </div>

            {/* Destination Location */}
            <div className="flex items-start gap-3 border-l-4 border-dark-400 py-3 px-3 bg-dark-50 rounded-lg">
              <MapPinPlus size={20} className="text-dark-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-dark-900 leading-5 truncate">
                  {rideData.destination.split(", ")[0]}
                </h1>
                <p className="text-xs text-dark-500 truncate">
                  {rideData.destination.split(", ").slice(1).join(", ")}
                </p>
              </div>
            </div>

            {/* Fare */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 py-3 px-3 rounded-lg">
              <CreditCard size={20} className="text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-dark-500">Fare</p>
                <h1 className="text-lg font-bold text-primary-600">₹ {rideData.fare}</h1>
              </div>
              <span className="text-xs bg-white text-dark-600 px-2 py-1 rounded font-semibold">
                {rideData.paymentMethod === "razorpay" ? "Online after trip" : "Cash"}
              </span>
            </div>
          </div>

          {showBtn == "accept" ? (
            <div className="flex gap-3 mt-4">
              <Button
                title={"Ignore"}
                loading={loading}
                fun={ignoreRide}
                variant="secondary"
                classes={"flex-1"}
              />
              <Button 
                title={"Accept Ride"} 
                fun={acceptRide} 
                loading={loading}
                loadingMessage={"Accepting..."}
                variant="primary"
                classes={"flex-1"}
              />
            </div>
          ) : showBtn == "otp" ? (
            <>
              <input
                type="number"
                minLength={6}
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={"Enter 6-digit OTP"}
                className="mt-4 mb-2 w-full rounded-lg border-2 border-dark-200 bg-white px-4 py-3 text-lg text-center font-semibold shadow-card outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 tracking-widest"
              />
              {error && (
                <p className="text-red-500 text-xs mb-2 text-center font-medium">{error}</p>
              )}
              <Button 
                title={"Verify OTP"} 
                loading={loading}
                loadingMessage={"Verifying..."}
                fun={verifyOTP}
                variant="primary"
              />{" "}
            </>
          ) : (
            <Button
              title={"End Ride"}
              fun={endRide}
              loading={loading}
              loadingMessage={"Ending..."}
              variant="primary"
              classes={"mt-4"}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default NewRide;
