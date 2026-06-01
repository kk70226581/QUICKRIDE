import { ChevronDown, Clock3, ShieldCheck, UsersRound, Zap } from "lucide-react";

const vehicles = [
  {
    id: 1,
    name: "Car",
    description: "Affordable, compact rides",
    meta: "Best daily pick",
    eta: "3-5 min",
    seats: "4 seats",
    type: "car",
    image: "car.png",
    price: 193.8,
  },
  {
    id: 2,
    name: "Bike",
    description: "Affordable, motorcycle rides",
    meta: "Fast in traffic",
    eta: "2-4 min",
    seats: "1 seat",
    type: "bike",
    image: "bike.webp",
    price: 254.7,
  },
  {
    id: 3,
    name: "Auto",
    description: "Affordable, auto rides",
    meta: "Short-hop ready",
    eta: "4-6 min",
    seats: "3 seats",
    type: "auto",
    image: "auto.webp",
    price: 200.0,
  },
];

function SelectVehicle({
  selectedVehicle,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  showNextPanel,
  fare,
  fareDetails,
  distanceTime,
}) {
  return (
    <>
      <div
        className={`${showPanel ? "bottom-0" : "-bottom-[85%]"} surface-panel absolute inset-x-0 z-10 max-h-[82dvh] w-full overflow-y-auto rounded-t-[1.35rem] p-4 pt-0 transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[28rem] sm:rounded-2xl ${showPanel ? "sm:translate-y-0" : "sm:translate-y-[calc(100%+3rem)]"}`}
      >
        <div
          onClick={() => {
            setShowPanel(false);
            showPreviousPanel(true);
          }}
          className="flex justify-center py-3 pb-4 cursor-pointer"
        >
          <ChevronDown strokeWidth={2.5} className="text-dark-300" size={28} />
        </div>
        <div className="mb-3 px-2">
          <p className="text-xs font-bold uppercase text-emerald-700">Matched ride options</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Choose a ride</h2>
          {distanceTime && (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="rounded-md bg-dark-100 px-2 py-1 text-dark-600">
                {distanceTime.distance?.text} away
              </span>
              <span className="rounded-md bg-dark-100 px-2 py-1 text-dark-600">
                {distanceTime.duration?.text} estimated
              </span>
              <span className="rounded-md bg-primary-50 px-2 py-1 text-primary-700">
                {distanceTime.source === "google" ? "Live route" : "Estimated route"}
              </span>
              {distanceTime.cacheStatus === "hit" && (
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                  Fast cached
                </span>
              )}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-600">
            <span className="rounded-lg bg-white px-2 py-2 shadow-sm">No surge lock</span>
            <span className="rounded-lg bg-white px-2 py-2 shadow-sm">Live nearby</span>
            <span className="rounded-lg bg-white px-2 py-2 shadow-sm">Secure OTP</span>
          </div>
        </div>
        {vehicles.map((vehicle) => (
          <Vehicle
            key={vehicle.id}
            vehicle={vehicle}
            fare={fare}
            fareDetails={fareDetails}
            selectedVehicle={selectedVehicle}
            setShowPanel={setShowPanel}
            showNextPanel={showNextPanel}
          />
        ))}
      </div>
    </>
  );
}

const Vehicle = ({
  vehicle,
  selectedVehicle,
  fare,
  fareDetails,
  setShowPanel,
  showNextPanel,
}) => {
  const details = fareDetails?.[vehicle.type];
  const crowdText =
    details?.crowdMultiplier > 1.15
      ? `${details.crowdMultiplier}x busy`
      : "Normal demand";
  const chooseVehicle = () => {
    selectedVehicle(vehicle.type);
    setShowPanel(false);
    showNextPanel(true);
  };

  return (
    <div
      onClick={chooseVehicle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          chooseVehicle();
        }
      }}
      className="surface-card group my-3 flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]"
      role="button"
      tabIndex={0}
    >
      <div className="py-4 pl-2">
        <img
          src={`/${vehicle.image}`}
          className="w-24 scale-75 mix-blend-multiply group-hover:scale-90 transition-transform"
          alt={`${vehicle.name} ride option`}
        />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base font-bold text-dark-900">{vehicle.name}</h1>
          {vehicle.type === "car" && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Recommended
            </span>
          )}
        </div>
        <p className="text-xs text-dark-500">{vehicle.description}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <Clock3 size={12} />
            {vehicle.eta}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <UsersRound size={12} />
            {vehicle.seats}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
            {vehicle.type === "bike" ? <Zap size={12} /> : <ShieldCheck size={12} />}
            {vehicle.meta}
          </span>
        </div>
        {details && (
          <p className="mt-1 text-[11px] font-semibold text-dark-400">
            {crowdText} | {details.onlineCaptains} online
          </p>
        )}
      </div>
      <div className="pr-4 text-right">
        <h3 className="font-bold text-lg text-primary-600">Rs {fare[vehicle.type]}</h3>
        <p className="text-xs text-dark-400">Approx fare</p>
      </div>
    </div>
  );
};
export default SelectVehicle;
