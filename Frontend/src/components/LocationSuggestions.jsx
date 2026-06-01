import { MapPin } from "lucide-react";
import Console from "../utils/console";

function LocationSuggestions({
  suggestions = [],
  setSuggestions,
  setPickupLocation,
  setDestinationLocation,
  input,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      {suggestions.map((suggestion, index) => (
        <div
          onClick={() => {
            Console.log(suggestion);
            if (input == "pickup") {
              setPickupLocation(suggestion);
              setSuggestions([]);
            }
            if (input == "destination") {
              setDestinationLocation(suggestion);
              setSuggestions([]);
            }
          }}
          key={index}
          className="cursor-pointer flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0 transition hover:bg-emerald-50/70"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <MapPin size={18} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{suggestion}</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Tap to use this location</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LocationSuggestions;
