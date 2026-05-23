import axios from "axios";
import {
  CarFront,
  CircleUserRound,
  History,
  LogOut,
  MapPinned,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Console from "../utils/console";

function AppNav({ overlay = false }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const account = JSON.parse(localStorage.getItem("userData"));
  const role = account?.type || "user";
  const profile = account?.data;
  const homePath = role === "captain" ? "/captain/home" : "/home";
  const ridesPath = `/${role}/rides`;
  const profilePath = `/${role}/edit-profile`;

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
    `flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
      isActive
        ? "bg-emerald-100 text-emerald-950"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <header
      className={`z-20 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur ${
        overlay ? "absolute inset-x-0 top-0" : "sticky top-0"
      }`}
    >
      <div className="mx-auto flex min-h-20 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to={homePath} className="mr-auto flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-950 text-emerald-300">
            <CarFront size={22} />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-5 text-slate-950">
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

        <div className="hidden min-w-0 border-l border-slate-200 pl-4 lg:block">
          <p className="max-w-40 truncate text-sm font-semibold text-slate-950">
            {profile?.fullname?.firstname} {profile?.fullname?.lastname}
          </p>
          <p className="max-w-40 truncate text-xs font-normal text-slate-500">
            {profile?.email}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          aria-label="Logout"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
