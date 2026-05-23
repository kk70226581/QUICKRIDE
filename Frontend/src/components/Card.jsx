function Card({ children, className = "", hover = true, onClick }) {
  const baseClasses = "rounded-xl border border-dark-100 bg-white shadow-card p-5 sm:p-6";
  const hoverClasses = hover ? "card-hover cursor-pointer" : "";
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Card;
