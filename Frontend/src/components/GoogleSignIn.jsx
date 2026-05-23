import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Console from "../utils/console";
import { Spinner } from "./index";

function GoogleSignIn({ userType = "user" }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleSignInEnabled =
    import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === "true" && Boolean(googleClientId);

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
        width: 320,
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

  const handleCredentialResponse = async (response) => {
    try {
      setLoading(true);

      const result = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/${userType}/google-signin`,
        {
          token: response.credential,
        }
      );

      Console.log("Google Sign-In Response:", result.data);

      localStorage.setItem("token", result.data.token);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          type: userType,
          data: result.data.user,
        })
      );

      // Redirect based on user type
      navigate(userType === "captain" ? "/captain/home" : "/home");
    } catch (error) {
      Console.error("Google Sign-In Error:", error);
      alert(error.response?.data?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  if (!googleSignInEnabled) {
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
    </div>
  );
}

export default GoogleSignIn;
