import { useEffect } from "react";
import {
  ArrowRight,
  CarFront,
  Clock3,
  MapPinned,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "../components/index";
import background from "/get_started_illustration.jpg";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import logo from "/logo-quickride.png";

function GetStarted() {
  const navigate = useNavigate();
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      if (JSON.parse(userData).type == "user") {
        navigate("/home");
      } else if (JSON.parse(userData).type == "captain") {
        navigate("/captain/home");
      }
    }
  }, []);

  return (
    <div className="bg-white text-dark-950">
      <section
        className="relative flex min-h-[92dvh] flex-col overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.94)_0%,rgba(2,6,23,0.78)_40%,rgba(2,6,23,0.34)_76%,rgba(2,6,23,0.2)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.76))]" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <img
            className="h-10 object-contain brightness-0 invert sm:h-12"
            src={logo}
            alt="QuickRide Logo"
          />
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-lg px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Rider login
            </Link>
            <Link
              to="/captain/login"
              className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-dark-950"
            >
              Captain login
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pb-24 pt-8 sm:px-8 lg:px-10">
          <div className="max-w-3xl animate-fade-in">
            <p className="mb-5 inline-flex items-center gap-2 border-l-4 border-primary-400 pl-3 text-sm font-semibold text-primary-200">
              <MapPinned size={17} />
              Book, track, and coordinate every ride live
            </p>
            <h1 className="max-w-3xl text-5xl font-bold leading-tight text-white sm:text-7xl">
              QuickRide
            </h1>
            <p className="mt-5 max-w-2xl text-base font-normal leading-7 text-white/82 sm:text-xl sm:leading-8">
              A ride booking workspace for riders and captains with live
              location updates, trip status, fare estimates, and in-ride chat
              in one clear experience.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:flex sm:items-center">
              <div className="sm:w-56">
                <Button
                  title="Book a Ride"
                  path="/login"
                  type="link"
                  icon={<ArrowRight className="h-5 w-5" />}
                  variant="primary"
                  classes="rounded-lg"
                />
              </div>
              <Link
                to="/captain/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-dark-950 sm:w-56"
              >
                <CarFront size={19} />
                Drive with QuickRide
              </Link>
            </div>

            <div className="mt-10 grid max-w-3xl gap-4 border-t border-white/20 pt-6 text-white sm:grid-cols-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Clock3 size={17} className="text-primary-300" />
                  Quick booking
                </p>
                <p className="mt-2 text-sm font-normal leading-6 text-white/68">
                  Search pickup and destination, compare ride types, confirm.
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquareText size={17} className="text-primary-300" />
                  Trip communication
                </p>
                <p className="mt-2 text-sm font-normal leading-6 text-white/68">
                  Keep ride status, OTP, chat, and captain contact close.
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={17} className="text-primary-300" />
                  Role-based flow
                </p>
                <p className="mt-2 text-sm font-normal leading-6 text-white/68">
                  Rider and captain workspaces stay focused on their jobs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-dark-200 bg-dark-950 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-8 sm:px-8 md:grid-cols-[1.2fr_0.8fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold text-primary-300">
              Built for the full ride
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">
              From finding the route to finishing the trip, the important
              actions stay visible.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-l border-white/20 pl-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <UsersRound size={17} className="text-primary-300" />
                Rider side
              </p>
              <p className="mt-2 text-sm font-normal leading-6 text-white/65">
                Fare options, map routing, captain details, and chat.
              </p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CarFront size={17} className="text-primary-300" />
                Captain side
              </p>
              <p className="mt-2 text-sm font-normal leading-6 text-white/65">
                Incoming rides, OTP checks, earnings, and active navigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-primary-700">
                Product views
              </p>
              <h2 className="mt-2 text-3xl font-bold text-dark-950">
                One platform, two focused workspaces
              </h2>
            </div>
            <p className="max-w-xl text-sm font-normal leading-6 text-dark-600">
              The rider screen is built around trip selection and map context.
              The captain screen prioritizes requests, ride progress, and
              vehicle details.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-xl border border-dark-200 bg-white shadow-card-lg">
              <div className="border-b border-dark-100 p-5">
                <p className="text-sm font-semibold text-primary-700">
                  For riders
                </p>
                <h3 className="mt-1 text-xl font-bold text-dark-950">
                  Search, choose, and follow the ride
                </h3>
              </div>
              <img
                src="/user-module.png"
                alt="QuickRide rider booking interface"
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </article>

            <article className="overflow-hidden rounded-xl border border-dark-200 bg-white shadow-card-lg">
              <div className="border-b border-dark-100 p-5">
                <p className="text-sm font-semibold text-amber-700">
                  For captains
                </p>
                <h3 className="mt-1 text-xl font-bold text-dark-950">
                  Accept requests and manage active trips
                </h3>
              </div>
              <img
                src="/captain-module.png"
                alt="QuickRide captain ride management interface"
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GetStarted;
