import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Heading, Input, GoogleSignIn } from "../components";
import apiClient from "../utils/apiClient";
import Console from "../utils/console";
import { getApiErrorMessage } from "../utils/apiError";

function UserSignup() {
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

  const signupUser = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      email: data.email,
      password: data.password,
      phone: data.phone,
    };

    try {
      setLoading(true);
      const response = await apiClient.post("/user/register", userData);
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      navigation("/home");
    } catch (error) {
      setResponseError(getApiErrorMessage(error));
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setResponseError("");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [responseError]);

  return (
    <AuthLayout
      roleLabel="Rider registration"
      rolePath="/captain/signup"
      roleAction="Captain sign up"
    >
      <div className="mx-auto w-full max-w-xl rounded-xl border border-dark-200 bg-white/98 p-6 shadow-card-xl sm:p-8">
        <p className="mb-3 text-sm font-bold text-primary-700">Rider account</p>
        <Heading
          title="Create Rider Account"
          subtitle="Set up your profile and start booking rides."
        />

        <form onSubmit={handleSubmit(signupUser)} className="space-y-2">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstname"
              register={register}
              error={errors.firstname}
            />
            <Input
              label="Last name"
              name="lastname"
              register={register}
              error={errors.lastname}
            />
          </div>
          <Input
            label="Phone Number"
            type="number"
            name="phone"
            register={register}
            error={errors.phone}
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="you@example.com"
            register={register}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            register={register}
            error={errors.password}
          />

          {responseError && (
            <div className="rounded border-l-4 border-red-500 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{responseError}</p>
            </div>
          )}

          <Button title="Create Account" loading={loading} type="submit" />
        </form>

        <GoogleSignIn userType="user" />

        <p className="mt-5 border-t border-dark-200 pt-5 text-center text-sm font-normal text-dark-600">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary-700 hover:underline">
            Login
          </Link>
        </p>

        <div className="mt-6">
          <Button
            type="link"
            path="/captain/signup"
            title="Sign Up as Captain"
            variant="secondary"
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default UserSignup;
