import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Console from "../utils/console";
import { Spinner } from "./index";

function GoogleSignIn({ userType = "user" }) {
  const [loading, setLoading] = useState(false);
  const [pendingCredential, setPendingCredential] = useState("");
  const [profileRequired, setProfileRequired] = useState(false);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [completionError, setCompletionError] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullname: {
      firstname: "",
      lastname: "",
    },
    phone: "",
    vehicle: {
      color: "",
      number: "",
      capacity: "4",
      type: "car",
    },
  });
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const allowedOrigins = (import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const currentOrigin = window.location.origin;
  const isGoogleOriginAllowed =
    allowedOrigins.length === 0 || allowedOrigins.includes(currentOrigin);
  const googleSignInEnabled =
    import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === "true" &&
    Boolean(googleClientId) &&
    isGoogleOriginAllowed;

  useEffect(() => {
    if (!googleSignInEnabled) {
      return;
    }

    let intervalId;

    const initializeGoogleSignIn = () => {
      if (!window.google || !buttonRef.current || buttonRef.current.children.length) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: Math.min(320, window.innerWidth - 48),
        locale: "en",
      });
    };

    // Load Google Sign-In script
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      intervalId = setInterval(initializeGoogleSignIn, 100);
      initializeGoogleSignIn();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [googleClientId, googleSignInEnabled]);

  const completeSignIn = async (credential, profile) => {
    try {
      setLoading(true);
      setCompletionError("");

      const result = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/${userType}/google-signin`,
        {
          token: credential,
          ...(profile ? { profile } : {}),
        }
      );

      Console.log("Google Sign-In Response:", result.data);

      const account = userType === "captain" ? result.data.captain : result.data.user;

      localStorage.setItem("token", result.data.token);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          type: userType,
          data: account,
        })
      );

      // Redirect based on user type
      navigate(userType === "captain" ? "/captain/home" : "/home");
    } catch (error) {
      Console.error("Google Sign-In Error:", error);
      if (error.response?.status === 409 && error.response?.data?.profileRequired) {
        const nextGoogleProfile = error.response.data.googleProfile;

        setPendingCredential(credential);
        setGoogleProfile(nextGoogleProfile);
        setProfileRequired(true);
        setProfileForm((current) => ({
          ...current,
          fullname: {
            firstname: nextGoogleProfile?.fullname?.firstname || current.fullname.firstname,
            lastname: nextGoogleProfile?.fullname?.lastname || current.fullname.lastname,
          },
        }));
        setCompletionError(error.response.data.message || "");
        return;
      }

      const message = error.response?.data?.message || "Google sign-in failed";
      setCompletionError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialResponse = async (response) => {
    await completeSignIn(response.credential);
  };

  const updateProfileForm = (path, value) => {
    setProfileForm((current) => {
      if (path.length === 1) {
        return { ...current, [path[0]]: value };
      }

      return {
        ...current,
        [path[0]]: {
          ...current[path[0]],
          [path[1]]: value,
        },
      };
    });
  };

  const validateCompletionForm = () => {
    if (profileForm.fullname.firstname.trim().length < 3) {
      return "First name must be at least 3 characters long";
    }

    if (!/^\d{10}$/.test(profileForm.phone.trim())) {
      return "Enter a valid 10 digit mobile number";
    }

    if (userType === "captain") {
      if (profileForm.vehicle.color.trim().length < 3) {
        return "Enter your vehicle color";
      }

      if (profileForm.vehicle.number.trim().length < 3) {
        return "Enter your vehicle number";
      }

      const capacity = Number(profileForm.vehicle.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 8) {
        return "Vehicle capacity must be between 1 and 8";
      }
    }

    return "";
  };

  const handleProfileCompletion = async (event) => {
    event.preventDefault();

    const error = validateCompletionForm();
    if (error) {
      setCompletionError(error);
      return;
    }

    const profile = {
      fullname: {
        firstname: profileForm.fullname.firstname.trim(),
        lastname: profileForm.fullname.lastname.trim(),
      },
      phone: profileForm.phone.trim(),
    };

    if (userType === "captain") {
      profile.vehicle = {
        color: profileForm.vehicle.color.trim(),
        number: profileForm.vehicle.number.trim(),
        capacity: Number(profileForm.vehicle.capacity),
        type: profileForm.vehicle.type,
      };
    }

    await completeSignIn(pendingCredential, profile);
  };

  const closeCompletionForm = () => {
    setPendingCredential("");
    setProfileRequired(false);
    setGoogleProfile(null);
    setCompletionError("");
  };

  if (!googleSignInEnabled) {
    if (
      import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === "true" &&
      googleClientId &&
      !isGoogleOriginAllowed
    ) {
      return (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Google login is disabled for this local URL. Add {currentOrigin} to
          Google OAuth authorized JavaScript origins, then add it to
          VITE_GOOGLE_ALLOWED_ORIGINS.
        </div>
      );
    }

    return null;
  }

  return (
    <div className="w-full">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dark-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-dark-500 font-medium">Or continue with</span>
        </div>
      </div>

      <div ref={buttonRef} className="w-full flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <Spinner size="sm" />
            Signing in...
          </div>
        )}
      </div>

      {profileRequired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={handleProfileCompletion}
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          >
            <div className="mb-4">
              <h2 className="text-lg font-bold text-dark-900">Complete Google signup</h2>
              <p className="mt-1 text-sm text-dark-500">{googleProfile?.email}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-dark-700">
                First name
                <input
                  type="text"
                  value={profileForm.fullname.firstname}
                  onChange={(event) => updateProfileForm(["fullname", "firstname"], event.target.value)}
                  className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  required
                />
              </label>

              <label className="text-sm font-semibold text-dark-700">
                Last name
                <input
                  type="text"
                  value={profileForm.fullname.lastname}
                  onChange={(event) => updateProfileForm(["fullname", "lastname"], event.target.value)}
                  className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
            </div>

            <label className="mt-3 block text-sm font-semibold text-dark-700">
              Mobile number
              <input
                type="tel"
                inputMode="numeric"
                maxLength="10"
                value={profileForm.phone}
                onChange={(event) =>
                  updateProfileForm(["phone"], event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                required
              />
            </label>

            {userType === "captain" && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-dark-700">
                  Vehicle color
                  <input
                    type="text"
                    value={profileForm.vehicle.color}
                    onChange={(event) => updateProfileForm(["vehicle", "color"], event.target.value)}
                    className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark-700">
                  Vehicle number
                  <input
                    type="text"
                    value={profileForm.vehicle.number}
                    onChange={(event) => updateProfileForm(["vehicle", "number"], event.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark-700">
                  Capacity
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={profileForm.vehicle.capacity}
                    onChange={(event) => updateProfileForm(["vehicle", "capacity"], event.target.value)}
                    className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark-700">
                  Vehicle type
                  <select
                    value={profileForm.vehicle.type}
                    onChange={(event) => updateProfileForm(["vehicle", "type"], event.target.value)}
                    className="mt-1 w-full rounded-lg border-2 border-dark-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                  </select>
                </label>
              </div>
            )}

            {completionError && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {completionError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeCompletionForm}
                className="flex-1 rounded-lg border border-dark-200 px-4 py-2 text-sm font-semibold text-dark-700"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                disabled={loading}
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default GoogleSignIn;
