import { CarFront, MapPinned, Route, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "/logo-quickride.png";

function AuthLayout({
  children,
  roleLabel,
  rolePath,
  roleAction,
  accent = "rider",
}) {
  const accentStyles =
    accent === "captain"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-primary-200 bg-primary-50 text-primary-800";

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <header className="border-b border-white/70 bg-white/88 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="QuickRide" className="h-10 object-contain" />
          </Link>

          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link
              to="/"
              className="hidden rounded-lg px-4 py-3 text-dark-600 hover:bg-dark-100 hover:text-dark-950 sm:inline-flex"
            >
              Home
            </Link>
            <Link
              to={rolePath}
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:border-primary-200 hover:bg-primary-50"
            >
              {roleAction}
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative flex flex-1 overflow-x-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),transparent_36%,rgba(14,165,233,0.14)),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(236,253,245,0.88))]" />
        <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_30rem] lg:px-10 lg:py-12">
          <section className="hidden max-w-xl lg:block">
            <span
              className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold ${accentStyles}`}
            >
              {roleLabel}
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-tight text-dark-950">
              Colorful rides, clear choices, quick access.
            </h1>
            <p className="mt-5 max-w-lg text-base font-normal leading-7 text-dark-600">
              QuickRide keeps booking, live map context, ride status, and trip
              communication together for riders and captains.
            </p>

            <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-white/85 p-3 shadow-sm">
                <Sparkles size={19} className="text-emerald-600" />
                <p className="mt-2 text-sm font-bold text-slate-900">Fresh UI</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-white/85 p-3 shadow-sm">
                <Route size={19} className="text-sky-600" />
                <p className="mt-2 text-sm font-bold text-slate-900">Live routes</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white/85 p-3 shadow-sm">
                <ShieldCheck size={19} className="text-amber-600" />
                <p className="mt-2 text-sm font-bold text-slate-900">Safe trips</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 border-t border-dark-200 pt-6">
              <div className="flex gap-3">
                <MapPinned className="mt-1 text-primary-600" size={20} />
                <div>
                  <p className="font-semibold text-dark-950">Live trip context</p>
                  <p className="mt-1 text-sm font-normal leading-6 text-dark-600">
                    Routes, pickup details, and ride updates remain close.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CarFront className="mt-1 text-primary-600" size={20} />
                <div>
                  <p className="font-semibold text-dark-950">Role-ready flows</p>
                  <p className="mt-1 text-sm font-normal leading-6 text-dark-600">
                    Rider and captain journeys stay focused on the next action.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 text-primary-600" size={20} />
                <div>
                  <p className="font-semibold text-dark-950">Account access</p>
                  <p className="mt-1 text-sm font-normal leading-6 text-dark-600">
                    Authentication, verification, and password recovery connect
                    back to the ride workspace.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full">{children}</section>
        </div>
      </main>

      <footer className="border-t border-white/70 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-dark-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="font-normal">QuickRide ride booking workspace</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/" className="font-semibold text-dark-700 hover:text-primary-700">
              Home
            </Link>
            <span className="font-normal">Privacy Policy</span>
            <span className="font-normal">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AuthLayout;
