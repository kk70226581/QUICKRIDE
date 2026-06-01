import PropTypes from "prop-types";
import { Star, Trash2, MapPin, ArrowRight } from "lucide-react";
import Button from "./Button";

function FavoriteRoutes({ routes, onSelect, onRemove, onClear, onSave, currentRoute }) {
  const isSaveDisabled = !currentRoute.pickup || !currentRoute.destination;
  const routeAlreadySaved = routes.some(
    (route) =>
      route.pickup === currentRoute.pickup && route.destination === currentRoute.destination
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-card-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-700">Saved routes</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Quick start routes</h2>
          <p className="mt-1 text-sm text-slate-500">Tap a route to auto-fill pickup and destination.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            title={routeAlreadySaved ? "Saved" : "Save route"}
            fun={onSave}
            variant="secondary"
            classes="min-w-[10rem]"
            disabled={isSaveDisabled || routeAlreadySaved}
            icon={<Star size={16} />}
          />
          <Button
            title="Clear all"
            variant="ghost"
            fun={onClear}
            classes="min-w-[10rem]"
          />
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          You do not have any saved routes yet. Search and save one for faster booking.
        </div>
      ) : (
        <div className="grid gap-3">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => onSelect(route)}
              className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{route.label}</p>
                  <p className="text-xs text-slate-500 truncate" title={`${route.pickup} to ${route.destination}`}>
                    {route.pickup} → {route.destination}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  title="Use"
                  variant="primary"
                  fun={() => onSelect(route)}
                  classes="px-3 py-2 text-xs"
                  icon={<ArrowRight size={14} />}
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(route.id);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove saved route"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

FavoriteRoutes.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      pickup: PropTypes.string.isRequired,
      destination: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  currentRoute: PropTypes.shape({
    pickup: PropTypes.string,
    destination: PropTypes.string,
  }).isRequired,
};

export default FavoriteRoutes;
