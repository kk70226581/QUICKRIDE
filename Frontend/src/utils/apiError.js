export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;

  if (Array.isArray(data)) {
    return data[0]?.msg || data[0]?.message || fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  return data?.message || error?.message || fallback;
}
