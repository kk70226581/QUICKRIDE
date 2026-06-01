import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronUp,
  Clock,
  CreditCard,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { AppNav, Button } from "../components";

function RideHistory() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const user = userData.data || { rides: [] };
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRides = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (user.rides || []).filter((ride) => {
      const matchesStatus =
        statusFilter === "all" || (ride.status || "completed") === statusFilter;
      const routeText = `${ride.pickup || ""} ${ride.destination || ""}`.toLowerCase();
      const matchesQuery = !normalizedQuery || routeText.includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, user.rides]);

  const rides = useMemo(() => classifyAndSortRides(filteredRides), [filteredRides]);
  const totalSpent = useMemo(
    () => (user.rides || []).reduce((sum, ride) => sum + Number(ride.fare || 0), 0),
    [user.rides]
  );

  const rebookRide = (ride) => {
    navigate(
      `/home?pickup=${encodeURIComponent(ride.pickup)}&destination=${encodeURIComponent(
        ride.destination
      )}`
    );
  };

  function classifyAndSortRides(rides) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Helper function to check if a date is today
    const isToday = (date) =>
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    // Helper function to check if a date is yesterday
    const isYesterday = (date) =>
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    // Helper function to sort rides by date (recent to oldest)
    const sortByDate = (rides) =>
      rides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Arrays to hold classified rides
    const todayRides = [];
    const yesterdayRides = [];
    const earlierRides = [];

    // Classify rides
    rides.forEach((ride) => {
      const createdDate = new Date(ride.createdAt);
      if (isToday(createdDate)) {
        todayRides.push(ride);
      } else if (isYesterday(createdDate)) {
        yesterdayRides.push(ride);
      } else {
        earlierRides.push(ride);
      }
    });

    // Return sorted arrays
    return {
      today: sortByDate(todayRides),
      yesterday: sortByDate(yesterdayRides),
      earlier: sortByDate(earlierRides),
    };
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex gap-3 flex-wrap items-center">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-emerald-300 hover:text-slate-900"
        >
          <ArrowLeft strokeWidth={3} />
        </button>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-slate-950">Ride History</h1>
          <p className="mt-1 text-sm font-normal text-slate-500">
            Review your latest rides, fares, and route details.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total rides</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{user.rides?.length || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total spent</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">Rs {totalSpent}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick rebook</p>
          <p className="mt-3 text-base text-slate-700">Tap any ride to start again instantly.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_auto]">
        <label className="field-control flex min-h-12 items-center gap-2 rounded-lg px-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pickup or destination"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["all", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize transition ${
                statusFilter === status
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <details open className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-semibold mb-3 select-none">
            <span>Today</span>
            <ChevronUp className="w-5 h-5 transition-transform duration-300 group-open:rotate-180 text-gray-600" />
          </summary>
          {rides.today.length > 0 ? (
            rides.today.map((ride) => {
              return <Ride ride={ride} key={ride._id} onRebook={() => rebookRide(ride)} />;
            })
          ) : (
            <h1 className="text-sm text-center text-zinc-600">
              No rides found
            </h1>
          )}
        </details>

        <details open className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-semibold mb-3 select-none">
            <span>Yesterday</span>
            <ChevronUp className="w-5 h-5 transition-transform duration-300 group-open:rotate-180 text-gray-600" />
          </summary>
          {rides.yesterday.length > 0 ? (
            rides.yesterday.map((ride) => {
              return <Ride ride={ride} key={ride._id} onRebook={() => rebookRide(ride)} />;
            })
          ) : (
            <h1 className="text-sm text-center text-zinc-600">
              No rides found
            </h1>
          )}
        </details>

        <details open className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-semibold mb-3 select-none">
            <span>Earlier</span>
            <ChevronUp className="w-5 h-5 transition-transform duration-300 group-open:rotate-180 text-gray-600" />
          </summary>
          {rides.earlier.length > 0 ? (
            rides.earlier.map((ride) => {
              return <Ride ride={ride} key={ride._id} onRebook={() => rebookRide(ride)} />;
            })
          ) : (
            <h1 className="text-sm text-center text-zinc-600">
              No rides found
            </h1>
          )}
        </details>
      </div>
      </main>
    </div>
  );
}

export const Ride = ({ ride, onRebook }) => {
  function formatDate(inputDate) {
    const date = new Date(inputDate);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
  }

  function formatTime(inputDate) {
    const date = new Date(inputDate);

    // Extract hours and minutes
    let hours = date.getHours();
    const minutes = date.getMinutes();

    // Determine AM/PM
    const period = hours >= 12 ? "PM" : "AM";

    // Convert hours to 12-hour format
    hours = hours % 12 || 12; // Convert 0 to 12 for midnight

    // Format minutes to always show two digits
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    // Return the formatted time
    return `${hours}:${formattedMinutes} ${period}`;
  }

  return (
    <div className="relative mb-3 w-full cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-emerald-300 hover:bg-white">
      <div className="flex flex-wrap gap-2 justify-around">
        <h1 className="text-sm flex gap-1 items-center font-semibold">
          <Calendar size={13} className="-mt-[1px]" />{" "}
          {formatDate(ride.createdAt)}
        </h1>

        <h1 className="text-sm flex gap-1 items-center font-semibold">
          <Clock size={13} className="-mt-[1px]" /> {formatTime(ride.createdAt)}
        </h1>
        <h1 className="text-sm flex gap-1 items-center font-semibold ">
          <CreditCard size={13} className="-mt-[1px] text-black" />Rs {ride.fare}
        </h1>
        {/* </div>
        <div className="flex flex-wrap gap-2 justify-around">
          <h1 className="text-xs flex gap-1 items-center font-semibold">
            <Route size={13} className="-mt-[1px]" />{" "}
            {Math.round(ride.distance / 1000)} KM
          </h1>
          <h1 className="text-xs flex gap-1 items-center font-semibold">
            <Timer size={13} className="-mt-[1px]" />{" "}
            {Math.round(ride.duration / 60)} minutes
          </h1> */}
      </div>

      <div className="bg-zinc-200 w-full h-[1px] my-2"></div>

      <div className="w-full  items-center truncate">
        <div className="flex items-center relative w-full h-fit">
          <div className="h-4/5 w-[3px] flex flex-col items-center justify-between border-dashed border-2  border-black rounded-full absolute mx-2">
            <div className="w-3 h-3 rounded-full border-[3px] -mt-1 bg-green-500 border-black"></div>
            <div className="w-3 h-3 rounded-sm border-[3px] -mb-1 bg-red-400 border-black"></div>
          </div>
          <div className="ml-7 truncate w-full">
            <h1 className=" text-xs truncate text-zinc-600 " title={ride.pickup}>{ride.pickup}</h1>
            <div className="flex items-center gap-2">
              <div className="bg-zinc-200 w-full h-[2px]"></div>
              <h1 className="text-xs text-zinc-500 ">TO</h1>
              <div className="bg-zinc-200 w-full h-[2px]"></div>
            </div>
            <h1 className=" text-xs truncate text-zinc-600 " title={ride.destination}>
              {ride.destination}
            </h1>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {ride.status ? ride.status.toUpperCase() : "COMPLETED"}
        </span>
        <Button
          title="Rebook"
          variant="secondary"
          fun={onRebook}
          classes="px-3 py-2 text-xs"
        />
      </div>
    </div>
  );
};

Ride.propTypes = {
  ride: PropTypes.shape({
    _id: PropTypes.string,
    createdAt: PropTypes.string,
    pickup: PropTypes.string,
    destination: PropTypes.string,
    fare: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }).isRequired,
  onRebook: PropTypes.func.isRequired,
};

export default RideHistory;
