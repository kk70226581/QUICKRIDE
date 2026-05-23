import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Heading, Input, GoogleSignIn } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { LogIn, Car } from "lucide-react";
import { getApiErrorMessage } from "../utils/apiError";

function CaptainLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const loginCaptain = async (data) => {
    if (data.email.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true)
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/captain/login`,
          data
        );
        Console.log(response);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify({
          type: "captain",
          data: response.data.captain,
        }));
        navigation("/captain/home");
      } catch (error) {
        setResponseError(getApiErrorMessage(error));
        Console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setResponseError("");
    }, 5000);
  }, [responseError]);

  return (
    <AuthLayout
      roleLabel="Captain access"
      rolePath="/login"
      roleAction="Rider login"
      accent="captain"
    >
      <div className="mx-auto flex w-full max-w-md flex-col justify-between rounded-xl border border-dark-200 bg-white/98 p-6 shadow-card-xl sm:p-8">
        <div>
          <p className="mb-3 text-sm font-bold text-amber-700">Captain access</p>
          
          <Heading title={"Welcome Captain"} subtitle={"Login to your account to start earning"} />

          <form onSubmit={handleSubmit(loginCaptain)} className="space-y-4">
            <Input
              label={"Email Address"}
              type={"email"}
              name={"email"}
              placeholder={"you@example.com"}
              register={register}
              error={errors.email}
            />
            <Input
              label={"Password"}
              type={"password"}
              name={"password"}
              placeholder={"••••••••"}
              register={register}
              error={errors.password}
            />
            
            {responseError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-sm text-red-700 font-medium">{responseError}</p>
              </div>
            )}

            <Link 
              to="/captain/forgot-password" 
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold inline-block hover:underline"
            >
              Forgot Password?
            </Link>

            <Button 
              title={"Login"} 
              loading={loading} 
              type="submit"
              variant="primary"
              icon={<LogIn size={18} />}
            />
          </form>

          <GoogleSignIn userType="captain" />

          <div className="mt-6 pt-6 border-t-2 border-dark-200">
            <p className="text-sm text-dark-600 text-center">
              Don&apos;t have an account?{" "}
              <Link to="/captain/signup" className="font-bold text-primary-600 hover:text-primary-700 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <Button
            type={"link"}
            path={"/login"}
            title={"Switch to Rider Login"}
            variant="secondary"
            icon={<Car size={18} />}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default CaptainLogin;
