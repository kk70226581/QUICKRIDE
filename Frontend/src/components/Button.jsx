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
  const baseStyles = "flex min-h-12 justify-center items-center gap-2 px-4 py-3 font-semibold rounded-lg shadow-card transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-glow-primary disabled:from-primary-400 disabled:to-primary-500",
    secondary: "bg-dark-100 text-dark-900 hover:bg-dark-200 border border-dark-200 disabled:bg-dark-100",
    outline: "border-2 border-primary-500 text-primary-600 hover:bg-primary-50 disabled:border-primary-300 disabled:text-primary-400",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-400",
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
        >
          {loading ? <span className="flex gap-2 items-center"><Spinner size="sm" />{loadingMessage}</span> : title}
          {!loading && icon}
        </button>
      )}
    </>
  );
}

export default Button;
