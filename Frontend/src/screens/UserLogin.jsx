import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Heading, Input, GoogleSignIn } from "../components";
import apiClient from "../utils/apiClient";
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
  } = useForm({
    mode: "onTouched",
  });

  const navigation = useNavigate();

  const loginUser = async (data) => {
    try {
      setLoading(true);
      const response = await apiClient.post("/user/login", data);
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          type: "user",
          data: response.data.user,
        })
      );
      navigation("/home");
    } catch (error) {
      setResponseError(getApiErrorMessage(error));
      Console.log(error);
    } finally {
      setLoading(false);
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
      <div className="surface-panel mx-auto flex w-full max-w-md flex-col justify-between rounded-2xl p-6 ring-1 ring-emerald-100 sm:p-8">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
            Rider access
          </p>
          
          <Heading title={"Welcome Back"} subtitle={"Login to your account to continue"} />

          <form onSubmit={handleSubmit(loginUser)} className="space-y-4">
            <Input
              label={"Email Address"}
              type={"email"}
              name={"email"}
              placeholder={"you@example.com"}
              register={register}
              validation={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
              error={errors.email}
            />
            <Input
              label={"Password"}
              type={"password"}
              name={"password"}
              placeholder={"••••••••"}
              register={register}
              validation={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              }}
              error={errors.password}
            />
            
            {responseError && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-sm text-red-700 font-medium">{responseError}</p>
              </div>
            )}

            <Link 
              to="/user/forgot-password" 
              className="inline-block text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
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

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
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
