import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AppNav, Button, Heading, Input } from "../components";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";
import { getApiErrorMessage } from "../utils/apiError";

function CaptainEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const { captain } = useCaptain();

  const navigation = useNavigate();

  const updateUserProfile = async (data) => {
    const captainData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
      vehicle: {
        color: data.color,
        number: data.number,
        capacity: data.capacity,
        type: data.type.toLowerCase(),
      },
    };
    Console.log(captainData);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/update`,
        { captainData },
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      navigation("/captain/home");
    } catch (error) {
      setResponseError(getApiErrorMessage(error));
      Console.log(error.response);
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
    <div className="min-h-dvh bg-slate-50">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex gap-3 border-b border-slate-100 pb-4">
          <ArrowLeft
            strokeWidth={3}
            className="mt-[5px] cursor-pointer"
            onClick={() => navigation(-1)}
          />
          <Heading title={"Edit Profile"} />
        </div>
        <div className="mt-5">
        <Input
          label={"Email"}
          type={"email"}
          name={"email"}
          register={register}
          error={errors.email}
          defaultValue={captain.email}
          disabled={true}
        />
        <form onSubmit={handleSubmit(updateUserProfile)}>
          <Input
            label={"Phone Number"}
            type={"number"}
            name={"phone"}
            register={register}
            error={errors.phone}
            defaultValue={captain.phone}
          />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Input
              label={"First name"}
              name={"firstname"}
              register={register}
              error={errors.firstname}
              defaultValue={captain.fullname.firstname}
            />
            <Input
              label={"Last name"}
              name={"lastname"}
              register={register}
              error={errors.lastname}
              defaultValue={captain.fullname.lastname}
            />
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Input
              label={"Vehicle colour"}
              name={"color"}
              register={register}
              error={errors.color}
              defaultValue={captain.vehicle.color}
            />
            <Input
              label={"Vehicle capacity"}
              type={"number"}
              name={"capacity"}
              register={register}
              error={errors.capacity}
              defaultValue={captain.vehicle.capacity}
            />
          </div>
          <Input
            label={"Vehicle number"}
            name={"number"}
            register={register}
            error={errors.number}
            defaultValue={captain.vehicle.number}
          />
          <Input
            label={"Vehicle type"}
            type={"select"}
            options={["Car", "Bike", "Auto"]}
            name={"type"}
            register={register}
            error={errors.type}
            defaultValue={captain.vehicle.type}
          />
          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}
          <Button
            title={"Update Profile"}
            loading={loading}
            type="submit"
            classes={"mt-4"}
          />
        </form>
        </div>
      </div>
      </main>
    </div>
  );
}

export default CaptainEditProfile;
