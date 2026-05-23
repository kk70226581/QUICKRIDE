import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Heading, Input, GoogleSignIn } from "../components";
import axios from "axios";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Console from "../utils/console";
import { getApiErrorMessage } from "../utils/apiError";

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [showVehiclePanel, setShowVehiclePanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const signupCaptain = async (data) => {
    const captainData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      email: data.email,
      password: data.password,
      phone: data.phone,
      vehicle: {
        color: data.color,
        number: data.number,
        capacity: data.capacity,
        type: data.type.toLowerCase(),
      },
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/register`,
        captainData
      );
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      navigation("/captain/home");
    } catch (error) {
      setResponseError(getApiErrorMessage(error));
      setShowVehiclePanel(false);
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
      roleLabel="Captain registration"
      rolePath="/signup"
      roleAction="Rider sign up"
      accent="captain"
    >
      <div className="mx-auto w-full max-w-xl rounded-xl border border-dark-200 bg-white/98 p-6 shadow-card-xl sm:p-8">
        <p className="mb-3 text-sm font-bold text-amber-700">Captain account</p>
        <Heading
          title="Create Captain Account"
          subtitle="Add your profile and vehicle details to receive rides."
        />

        <form onSubmit={handleSubmit(signupCaptain)}>
          {!showVehiclePanel && (
            <>
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
                <div className="mb-4 rounded border-l-4 border-red-500 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">{responseError}</p>
                </div>
              )}

              <button
                type="button"
                className="mt-4 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary-700 bg-primary-600 px-4 py-3 font-bold text-white shadow-card-lg transition hover:bg-primary-700"
                onClick={() => setShowVehiclePanel(true)}
              >
                Continue to Vehicle
                <ChevronRight strokeWidth={2.5} />
              </button>
            </>
          )}

          {showVehiclePanel && (
            <>
              <button
                type="button"
                onClick={() => setShowVehiclePanel(false)}
                aria-label="Back to captain details"
                className="-ml-1 mb-4 grid h-10 w-10 place-items-center rounded-lg text-dark-600 hover:bg-dark-100"
              >
                <ArrowLeft />
              </button>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Input
                  label="Vehicle colour"
                  name="color"
                  register={register}
                  error={errors.color}
                />
                <Input
                  label="Vehicle capacity"
                  type="number"
                  name="capacity"
                  register={register}
                  error={errors.capacity}
                />
              </div>
              <Input
                label="Vehicle number"
                name="number"
                register={register}
                error={errors.number}
              />
              <Input
                label="Vehicle type"
                type="select"
                options={["Car", "Bike", "Auto"]}
                name="type"
                register={register}
                error={errors.type}
              />

              {responseError && (
                <div className="mb-4 rounded border-l-4 border-red-500 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">{responseError}</p>
                </div>
              )}

              <Button
                title="Create Captain Account"
                loading={loading}
                type="submit"
              />
            </>
          )}
        </form>

        <GoogleSignIn userType="captain" />

        <p className="mt-5 border-t border-dark-200 pt-5 text-center text-sm font-normal text-dark-600">
          Already have an account?{" "}
          <Link
            to="/captain/login"
            className="font-bold text-amber-700 hover:underline"
          >
            Login
          </Link>
        </p>

        <div className="mt-6">
          <Button
            type="link"
            path="/signup"
            title="Sign Up as Rider"
            variant="secondary"
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default CaptainSignup;
