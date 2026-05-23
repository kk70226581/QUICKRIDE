import axios from "axios";
import { ArrowLeft, Send } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import Loading from "./Loading";
import { AppNav } from "../components";

function ChatScreen() {
  const { rideId, userType } = useParams();
  const navigation = useNavigate();
  const scrollableDivRef = useRef(null);

  const { socket } = useContext(SocketDataContext);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [socketID, setSocketID] = useState({});

  const currentUser = JSON.parse(localStorage.getItem("userData"))?.data?._id || null;

  const scrollToBottom = () => {
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollHeight;
    }
  };

  const getUserDetails = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/chat-details/${rideId}`
      );

      //  Protecting unauthorised users to read the chats
      if (currentUser !== response.data.user._id && currentUser !== response.data.captain._id) {
        Console.log("You are not authorized to view this chat.");
        navigation(-1);
        return;
      }
      setMessages(response.data.messages);

      socket.emit("join-room", rideId);
      if (userType == "user") {
        setUserData(response.data.captain);
      }
      if (userType == "captain") {
        setUserData(response.data.user);
      }
      const socketIds = {
        user: response.data.user.socketId,
        captain: response.data.captain.socketId,
      };
      setSocketID(socketIds);
    } catch (error) {
      Console.log("No such ride exists.");
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      return;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    socket.emit("message", { rideId: rideId, msg: message, userType: userType, time });
    setMessages((prev) => [...prev, { msg: message, by: userType, time }]);

    setMessage("");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userData) {
      scrollToBottom();
    }
  }, [userData]);

  useEffect(() => {
    setTimeout(() => {

      getUserDetails();
    }, 3000);

    socket.on("receiveMessage", ({ msg, by, time }) => {
      setMessages((prev) => [...prev, { msg, by, time }]);
    });


    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  if (userData) {
    return (
      <div className="flex h-dvh flex-col bg-slate-50">
        <AppNav />
        <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col p-3 sm:p-6">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        {/* header */}
        <div className="flex h-fit items-center gap-3 border-b border-slate-200 bg-white p-4">
          <ArrowLeft
            strokeWidth={3}
            className="cursor-pointer"
            onClick={() => navigation(-1)}
          />
          <div className="select-none rounded-full w-10 h-10 bg-emerald-600 flex items-center justify-center">
            <h1 className="text-lg font-semibold text-white">
              {userData?.fullname?.firstname[0]}
              {userData?.fullname?.lastname[0]}
            </h1>
          </div>

          <div>
            <h1 className="text-lg font-semibold text-black leading-6">
              {userData?.fullname?.firstname} {userData?.fullname?.lastname}
            </h1>
          </div>
        </div>
        <div className="h-full overflow-auto bg-slate-50" ref={scrollableDivRef}>
          <div className="flex w-full flex-col justify-end p-3 sm:p-5">
            {messages.length > 0 &&
              messages.map((message, i) => {
                return (
                  <span
                    key={i}
                    className={`${message.by == userType
                      ? "ml-auto rounded-br-none bg-slate-950 text-white"
                      : "mr-auto rounded-bl-none border border-slate-200 bg-white"
                      } mb-2 max-w-md rounded-md px-3 pb-[3px] pt-2 text-sm leading-5`}
                  >
                    {message.msg}
                    <div className="text-[10px] font-normal text-right opacity-60 mt-[1px]">{message.time}</div>
                  </span>
                );
              })}
          </div>
        </div>

        {/* Message */}
        <form
          className="flex h-fit items-center gap-2 border-t border-slate-200 bg-white p-3"
          onSubmit={sendMessage}
        >
          <input
            placeholder="Enter message..."
            className="w-full rounded-md border border-slate-200 p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
            spellCheck="false"
          />
          <button className="flex aspect-square h-12 cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-1 text-white hover:bg-emerald-700">
            <Send />
          </button>
        </form>
        </section>
        </main>
      </div>
    )
  } else {
    return <Loading />;
  }


}

export default ChatScreen;
