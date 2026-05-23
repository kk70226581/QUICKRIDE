import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import Console from "../utils/console";
import mailImg from "/mail.png";
import { Button, Spinner } from "../components";
import { getApiErrorMessage } from "../utils/apiError";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { userType } = useParams();
  const emailVerificationToken = searchParams.get("token");

  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const verifyEmail = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/${userType}/verify-email`,
        { token: emailVerificationToken }
      );
      console.log(response.data)
      if (response.status === 200) {
        Console.log("Email verified successfully:", response.data);
        setResponse("Your email is verified successfully. You can continue using the application.");
      }
    } catch (error) {
      Console.error("Error verifying email:", error);
      if (error.response?.data?.message === "Token Expired") {
        setResponse("Your verification link is expired. Please request a new verification link.");
      } else if (error.response && error.response.data && error.response.data.message) {
        setResponse(getApiErrorMessage(error, "An error occurred while verifying your email."));
      } else {
        setResponse(getApiErrorMessage(error, "An unexpected error occurred. Please try again later."));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailVerificationToken) {
      verifyEmail();
    } else {
      setResponse("Invalid verification link.");
    }
  }, [emailVerificationToken]);
  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_left,_#dcfce7,_transparent_32%),linear-gradient(135deg,_#f8fafc,_#ecfeff)] p-4 text-center sm:p-8">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white/95 p-6 shadow-xl sm:p-8">
      <h1 className="text-2xl font-bold">Email Verification</h1>
      <img src={mailImg} alt="Verify Email" className="h-24 mx-auto mb-4" />

      <p className="text-md font-semibold">
        {loading ? <Spinner /> : response}
      </p>
      <p className="my-4">{loading && "Verifying your email..."}</p>
      <Button
        title={"Go to Home"}
        fun={() => navigate(userType === 'captain' ? '/captain/home' : '/home')}
        disabled={loading}
      />
      </div>
    </div>
  );
};

export default VerifyEmail;
