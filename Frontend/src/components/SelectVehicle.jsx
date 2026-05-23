import { ChevronDown } from "lucide-react";

const vehicles = [
  {
    id: 1,
    name: "Car",
    description: "Affordable, compact rides",
    type: "car",
    image: "car.png",
    price: 193.8,
  },
  {
    id: 2,
    name: "Bike",
    description: "Affordable, motorcycle rides",
    type: "bike",
    image: "bike.webp",
    price: 254.7,
  },
  {
    id: 3,
    name: "Auto",
    description: "Affordable, auto rides",
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
        className={`${showPanel ? "bottom-0" : "-bottom-[75%]"} absolute inset-x-0 z-10 w-full rounded-t-2xl border border-dark-200 bg-white/98 p-4 pt-0 shadow-card-xl backdrop-blur-md transition-all duration-500 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[28rem] sm:rounded-xl ${showPanel ? "sm:translate-y-0" : "sm:translate-y-[calc(100%+3rem)]"}`}
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
          <h2 className="text-xl font-bold text-dark-900">Choose a ride</h2>
          {distanceTime && (
            <p className="mt-1 text-xs font-semibold text-dark-500">
              {distanceTime.distance?.text} away | {distanceTime.duration?.text} estimated
            </p>
          )}
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

  return (
    <div
      onClick={() => {
        selectedVehicle(vehicle.type);
        setShowPanel(false);
        showNextPanel(true);
      }}
      className="cursor-pointer my-3 flex items-center justify-between w-full overflow-hidden rounded-lg border-2 border-dark-100 bg-dark-50 transition-all duration-200 hover:border-primary-400 hover:bg-white hover:shadow-card-lg group"
    >
      <div className="py-4 pl-2">
        <img
          src={`/${vehicle.image}`}
          className="w-24 scale-75 mix-blend-multiply group-hover:scale-90 transition-transform"
        />
      </div>
      <div className="flex-1">
        <h1 className="text-base font-bold text-dark-900">{vehicle.name}</h1>
        <p className="text-xs text-dark-500">{vehicle.description}</p>
        {details && (
          <p className="mt-1 text-[11px] font-semibold text-dark-400">
            {crowdText} | {details.onlineCaptains} online
          </p>
        )}
      </div>
      <div className="pr-4 text-right">
        <h3 className="font-bold text-lg text-primary-600">₹ {fare[vehicle.type]}</h3>
        <p className="text-xs text-dark-400">Approx fare</p>
      </div>
    </div>
  );
};
export default SelectVehicle;
