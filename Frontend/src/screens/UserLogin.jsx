import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Heading, Input, GoogleSignIn } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { LogIn, MapPin } from "lucide-react";
import { getApiErrorMessage } from "../utils/apiError";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const loginUser = async (data) => {
    if (data.email.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/user/login`,
          data
        );
        Console.log(response);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify({
          type: "user",
          data: response.data.user,
        }));
        navigation("/home");
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
      roleLabel="Rider access"
      rolePath="/captain/login"
      roleAction="Captain login"
    >
      <div className="mx-auto flex w-full max-w-md flex-col justify-between rounded-xl border border-dark-200 bg-white/98 p-6 shadow-card-xl sm:p-8">
        <div>
          <p className="mb-3 text-sm font-bold text-primary-700">Rider access</p>
          
          <Heading title={"Welcome Back"} subtitle={"Login to your account to continue"} />

          <form onSubmit={handleSubmit(loginUser)} className="space-y-4">
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
              to="/user/forgot-password" 
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

          <GoogleSignIn userType="user" />

          <div className="mt-6 pt-6 border-t-2 border-dark-200">
            <p className="text-sm text-dark-600 text-center">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-bold text-primary-600 hover:text-primary-700 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <Button
            type={"link"}
            path={"/captain/login"}
            title={"Switch to Captain Login"}
            variant="secondary"
            icon={<MapPin size={18} />}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default UserLogin;
