function Input({ label, type, name, placeholder, defaultValue, register, error, options, disabled }) {
  const baseInputClasses = "w-full border-2 border-dark-200 bg-white px-4 py-3 rounded-lg outline-none text-sm my-1 shadow-card transition-all duration-200";
  const focusClasses = "focus:border-primary-500 focus:shadow-card-lg focus:bg-white";
  const disabledClasses = disabled ? "cursor-not-allowed select-none text-dark-300 bg-dark-50" : "";
  const errorClasses = error ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "";

  return (
    <div className="my-4 min-w-0 flex-1">
      <label className="text-sm font-semibold text-dark-700 block mb-2">{label}</label>
      {type == "select" ? (
        <select
          {...register(name)}
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
          {...register(name)}
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
