function Input({ label, type, name, placeholder, defaultValue, register, validation, error, options, disabled }) {
  const registration = typeof register === "function" ? register(name, validation) : {};
  const baseInputClasses = "field-control w-full px-4 py-3 rounded-lg outline-none text-sm my-1 transition-all duration-200";
  const focusClasses = "focus:bg-white";
  const disabledClasses = disabled ? "cursor-not-allowed select-none text-dark-300 bg-dark-50" : "";
  const errorClasses = error ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "";

  return (
    <div className="my-4 min-w-0 flex-1">
      <label className="text-xs font-bold uppercase tracking-normal text-slate-500 block mb-2">{label}</label>
      {type == "select" ? (
        <select
          {...registration}
          defaultValue={defaultValue}
          className={`${baseInputClasses} ${focusClasses} ${disabledClasses} ${errorClasses}`}
          disabled={disabled}
        >
          <option value="">Select {label}</option>
          {options && options.map((option) => {
            return (
              <option key={option} value={option.toLowerCase()} className="w-full">
                {option}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          {...registration}
          type={type || "text"}
          placeholder={placeholder || label}
          className={`${baseInputClasses} ${focusClasses} ${disabledClasses} ${errorClasses}`}
          disabled={disabled}
          defaultValue={defaultValue}
        />
      )}
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error.message}</p>}
    </div>
  );
}

export default Input;
