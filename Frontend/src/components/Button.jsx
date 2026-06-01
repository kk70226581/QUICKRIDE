import { Link } from "react-router-dom";
import Spinner from "./Spinner";

function Button({ 
  path, 
  title, 
  icon, 
  type, 
  classes, 
  fun, 
  loading, 
  loadingMessage, 
  disabled,
  variant = "primary"
}) {
  const baseStyles = "flex min-h-12 justify-center items-center gap-2 px-4 py-3 font-bold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_16px_36px_rgba(13,148,136,0.26)] hover:from-emerald-600 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-500",
    secondary: "border border-slate-200 bg-white text-slate-900 shadow-[0_10px_26px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:bg-slate-50 disabled:bg-slate-100",
    outline: "border border-emerald-500 bg-white text-emerald-700 hover:bg-emerald-50 disabled:border-emerald-300 disabled:text-emerald-400",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_16px_32px_rgba(225,29,72,0.24)] hover:from-rose-600 hover:to-red-700 disabled:from-rose-400 disabled:to-red-500",
  };

  const buttonClasses = `${baseStyles} ${variants[variant] || variants.primary} ${classes || ""} ${loading && "cursor-not-allowed opacity-80"}`;

  return (
    <>
      {type == "link" ? (
        <Link
          to={path}
          className={buttonClasses}
        >
          {title} {icon}
        </Link>
      ) : (
        <button
          type={type || "button"}
          className={buttonClasses}
          onClick={fun}
          disabled={loading || disabled}
          aria-busy={loading ? "true" : "false"}
        >
          {loading ? <span className="flex gap-2 items-center"><Spinner size="sm" />{loadingMessage}</span> : title}
          {!loading && icon}
        </button>
      )}
    </>
  );
}

export default Button;
