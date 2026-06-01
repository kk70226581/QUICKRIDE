import { lazy, Suspense, useEffect, useContext, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { logger } from "./utils/logger";
import { SocketDataContext } from "./contexts/SocketContext";
import Loading from "./screens/Loading";

const GetStarted = lazy(() => import("./screens/GetStarted"));
const UserLogin = lazy(() => import("./screens/UserLogin"));
const CaptainLogin = lazy(() => import("./screens/CaptainLogin"));
const UserHomeScreen = lazy(() => import("./screens/UserHomeScreen"));
const CaptainHomeScreen = lazy(() => import("./screens/CaptainHomeScreen"));
const UserProtectedWrapper = lazy(() => import("./screens/UserProtectedWrapper"));
const CaptainProtectedWrapper = lazy(() => import("./screens/CaptainProtectedWrapper"));
const UserSignup = lazy(() => import("./screens/UserSignup"));
const CaptainSignup = lazy(() => import("./screens/CaptainSignup"));
const RideHistory = lazy(() => import("./screens/RideHistory"));
const UserEditProfile = lazy(() => import("./screens/UserEditProfile"));
const CaptainEditProfile = lazy(() => import("./screens/CaptainEditProfile"));
const ErrorScreen = lazy(() => import("./screens/Error"));
const ChatScreen = lazy(() => import("./screens/ChatScreen"));
const VerifyEmailScreen = lazy(() => import("./screens/VerifyEmail"));
const ResetPasswordScreen = lazy(() => import("./screens/ResetPassword"));
const ForgotPasswordScreen = lazy(() => import("./screens/ForgotPassword"));

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app-shell min-h-dvh w-full">
      <div className="relative h-dvh w-full overflow-x-hidden overflow-y-auto bg-transparent">
        <div className="absolute right-4 top-24 z-50 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
          {isOnline ? "Online" : "Offline"}
        </div>

        <BrowserRouter>
          <LoggingWrapper />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<GetStarted />} />
              <Route
                path="/home"
                element={
                  <UserProtectedWrapper>
                    <UserHomeScreen />
                  </UserProtectedWrapper>
                }
              />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/signup" element={<UserSignup />} />
              <Route
                path="/user/edit-profile"
                element={
                  <UserProtectedWrapper>
                    <UserEditProfile />
                  </UserProtectedWrapper>
                }
              />
              <Route
                path="/user/rides"
                element={
                  <UserProtectedWrapper>
                    <RideHistory />
                  </UserProtectedWrapper>
                }
              />

              <Route
                path="/captain/home"
                element={
                  <CaptainProtectedWrapper>
                    <CaptainHomeScreen />
                  </CaptainProtectedWrapper>
                }
              />
              <Route path="/captain/login" element={<CaptainLogin />} />
              <Route path="/captain/signup" element={<CaptainSignup />} />
              <Route
                path="/captain/edit-profile"
                element={
                  <CaptainProtectedWrapper>
                    <CaptainEditProfile />
                  </CaptainProtectedWrapper>
                }
              />
              <Route
                path="/captain/rides"
                element={
                  <CaptainProtectedWrapper>
                    <RideHistory />
                  </CaptainProtectedWrapper>
                }
              />
              <Route path="/:userType/chat/:rideId" element={<ChatScreen />} />
              <Route path="/:userType/verify-email/" element={<VerifyEmailScreen />} />
              <Route path="/:userType/forgot-password/" element={<ForgotPasswordScreen />} />
              <Route path="/:userType/reset-password/" element={<ResetPasswordScreen />} />
              <Route path="*" element={<ErrorScreen />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;

function LoggingWrapper() {
  const location = useLocation();
  const { socket } = useContext(SocketDataContext);

  useEffect(() => {
    if (socket) {
      logger(socket);
    }
  }, [location.pathname, location.search]);
  return null;
}
