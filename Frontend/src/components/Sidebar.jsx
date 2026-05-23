import { useEffect, useState } from "react";

import { ChevronRight, CircleUserRound, History, KeyRound, Menu, X } from "lucide-react";
import Button from "./Button";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Console from "../utils/console";

function Sidebar() {
  const token = localStorage.getItem("token");
  const [showSidebar, setShowSidebar] = useState(false);

  const [newUser, setNewUser] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    setNewUser(userData);
  }, []);

  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/${newUser.type}/logout`,
        {
          headers: {
            token: token,
          },
        }
      );

      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("messages");
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
      navigate("/");
    } catch (error) {
      Console.log("Error getting logged out", error);
    }
  };
  return (
    <>
      <button
        className="absolute right-4 top-4 z-20 cursor-pointer rounded-lg border-2 border-dark-200 bg-white/98 p-2 shadow-lg backdrop-blur hover:bg-dark-50 transition-colors"
        onClick={() => {
          setShowSidebar(!showSidebar);
        }}
      >
        {showSidebar ? <X size={24} className="text-dark-900" /> : <Menu size={24} className="text-dark-900" />}
      </button>

      {/* Sidebar Component */}
      <div
        className={`${showSidebar ? " left-0 " : " -left-[100%] "
          } absolute bottom-0 z-10 flex h-dvh w-full max-w-md flex-col justify-between border-r-2 border-dark-200 bg-white/98 p-6 pt-8 shadow-card-xl backdrop-blur duration-300 sm:duration-500`}
      >
        <div className="select-none">
          <h1 className="text-3xl font-bold text-dark-900 mb-8">Account</h1>

          <div className="mb-6 text-center">
            <div className="my-4 rounded-full w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 mx-auto flex items-center justify-center shadow-lg">
              <h1 className="text-5xl font-bold text-white">
                {newUser?.data?.fullname?.firstname[0]}
                {newUser?.data?.fullname?.lastname[0]}
              </h1>
            </div>
            <h1 className="text-center font-bold text-2xl text-dark-900 mt-4">
              {newUser?.data?.fullname?.firstname}{" "}
              {newUser?.data?.fullname?.lastname}
            </h1>
            <h1 className="mt-2 text-center text-dark-500 text-sm">
              {newUser?.data?.email}
            </h1>
          </div>

          <nav className="space-y-2">
            <Link
              to={`/${newUser?.type}/edit-profile`}
              className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-primary-50 rounded-lg transition-colors border-2 border-transparent hover:border-primary-200"
              onClick={() => setShowSidebar(false)}
            >
              <div className="flex gap-3 items-center">
                <CircleUserRound size={20} className="text-primary-600" />
                <h1 className="font-semibold text-dark-900">Edit Profile</h1>
              </div>
              <ChevronRight size={20} className="text-dark-400" />
            </Link>

            <Link
              to={`/${newUser?.type}/rides`}
              className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-primary-50 rounded-lg transition-colors border-2 border-transparent hover:border-primary-200"
              onClick={() => setShowSidebar(false)}
            >
              <div className="flex gap-3 items-center">
                <History size={20} className="text-primary-600" />
                <h1 className="font-semibold text-dark-900">Ride History</h1>
              </div>
              <ChevronRight size={20} className="text-dark-400" />
            </Link>

            <Link
              to={`/${newUser?.type}/reset-password?token=${token}`}
              className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-primary-50 rounded-lg transition-colors border-2 border-transparent hover:border-primary-200"
              onClick={() => setShowSidebar(false)}
            >
              <div className="flex gap-3 items-center">
                <KeyRound size={20} className="text-primary-600" />
                <h1 className="font-semibold text-dark-900">Change Password</h1>
              </div>
              <ChevronRight size={20} className="text-dark-400" />
            </Link>
          </nav>
        </div>

        <Button 
          title={"Logout"} 
          variant="danger"
          fun={logout} 
        />
      </div>
    </>
  );
}

export default Sidebar;
