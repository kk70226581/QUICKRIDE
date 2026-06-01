import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  ChevronDown,
  Navigation,
  ShieldCheck,
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

  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    rideData.pickup
  )}&destination=${encodeURIComponent(rideData.destination)}`;

  return (
    <>
      <div
        className={`${
          showPanel ? "bottom-0" : "-bottom-[85%]"
        } surface-panel absolute inset-x-0 z-10 max-h-[86dvh] w-full overflow-y-auto rounded-t-[1.35rem] p-5 pt-2 transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[32rem] sm:rounded-2xl ${showPanel ? "sm:translate-y-0" : "sm:translate-y-[calc(100%+3rem)]"}`}
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
              <div className="flex h-12 w-12 select-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_14px_28px_rgba(13,148,136,0.24)]">
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

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
              <h1 className="font-bold text-primary-600 text-lg">Rs {rideData?.fare}</h1>
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
                <a href={"tel:" + rideData?.user?.phone} title="Call rider">
                  <PhoneCall size={20} strokeWidth={2} className="text-primary-600" />
                </a>
              </div>
              <a
                href={routeUrl}
                target="_blank"
                rel="noreferrer"
                className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                title="Open route"
              >
                <Navigation size={20} />
              </a>
            </div>
          )}

          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-600">
            <span className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-800">Verified rider</span>
            <span className="rounded-lg bg-sky-50 px-2 py-2 text-sky-800">Map ready</span>
            <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 py-2 text-slate-800">
              <ShieldCheck size={13} />
              OTP
            </span>
          </div>

          <div className="space-y-2">
            {/* Pickup Location */}
            <div className="flex items-start gap-3 border-l-4 border-emerald-500 py-3 px-3 bg-emerald-50 rounded-lg">
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
            <div className="flex items-start gap-3 border-l-4 border-slate-700 py-3 px-3 bg-slate-50 rounded-lg">
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
            <div className="surface-card flex items-center gap-3 rounded-xl px-3 py-3">
              <CreditCard size={20} className="text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-dark-500">Fare</p>
                <h1 className="text-lg font-bold text-primary-600">Rs {rideData.fare}</h1>
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
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={"Enter 6-digit OTP"}
                className="field-control mt-4 mb-2 w-full rounded-lg px-4 py-3 text-center text-lg font-bold tracking-widest outline-none"
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
            <>
              {error && (
                <p className="mt-3 text-red-500 text-xs text-center font-medium">{error}</p>
              )}
              <Button
                title={"End Ride"}
                fun={endRide}
                loading={loading}
                loadingMessage={"Ending..."}
                variant="primary"
                classes={"mt-4"}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default NewRide;
