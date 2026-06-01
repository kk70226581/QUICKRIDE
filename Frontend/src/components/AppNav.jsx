import { useEffect, useState } from "react";
import axios from "axios";
import {
  CarFront,
  CircleUserRound,
  History,
  LogOut,
  MapPinned,
  Wifi,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Console from "../utils/console";

function AppNav({ overlay = false }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const account = JSON.parse(localStorage.getItem("userData"));
  const role = account?.type || "user";
  const homePath = role === "captain" ? "/captain/home" : "/home";
  const ridesPath = `/${role}/rides`;
  const profilePath = `/${role}/edit-profile`;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const logout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_SERVER_URL}/${role}/logout`, {
        headers: { token },
      });
    } catch (error) {
      Console.log("Logout request failed", error);
    } finally {
      [
        "token",
        "userData",
        "messages",
        "rideDetails",
        "panelDetails",
        "showPanel",
        "showBtn",
      ].forEach((key) => localStorage.removeItem(key));
      navigate("/");
    }
  };

  const navClass = ({ isActive }) =>
    `flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
      isActive
        ? "bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.22)]"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <header
      className={`z-20 w-full border-b border-white/70 bg-white/88 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl ${
        overlay ? "absolute inset-x-0 top-0" : "sticky top-0"
      }`}
    >
      <div className="mx-auto flex min-h-[5.25rem] w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to={homePath} className="mr-auto flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-950 text-emerald-300 shadow-[0_16px_32px_rgba(15,23,42,0.22)]">
            <CarFront size={22} />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-bold leading-5 text-slate-950">
              QuickRide
            </span>
            <span className="block truncate text-xs font-normal capitalize text-slate-500">
              {role} workspace
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to={homePath} className={navClass}>
            <MapPinned size={17} />
            Live map
          </NavLink>
          <NavLink to={ridesPath} className={navClass}>
            <History size={17} />
            Ride history
          </NavLink>
          <NavLink to={profilePath} className={navClass}>
            <CircleUserRound size={17} />
            Profile
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 border-l border-emerald-100 pl-4 lg:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            <Wifi size={14} className={isOnline ? "text-emerald-600" : "text-red-500"} />
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          aria-label="Logout"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
        </button>
      </div>

      <nav className="grid grid-cols-3 gap-1 border-t border-slate-100 px-3 py-2 md:hidden">
        <NavLink to={homePath} className={navClass}>
          <MapPinned size={17} />
          Map
        </NavLink>
        <NavLink to={ridesPath} className={navClass}>
          <History size={17} />
          Rides
        </NavLink>
        <NavLink to={profilePath} className={navClass}>
          <CircleUserRound size={17} />
          Profile
        </NavLink>
      </nav>
    </header>
  );
}

export default AppNav;
