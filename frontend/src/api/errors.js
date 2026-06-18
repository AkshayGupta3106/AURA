
export function friendlyError(err) {
  if (!err?.response) return "Can't reach the server. Check your connection.";
  const { status, data } = err.response;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 401) return "Session expired — please log in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Not found.";
  if (status === 422) return "Invalid input — check the form and try again.";
  if (status >= 500)  return "Something went wrong. Try again in a moment.";
  return "An unexpected error occurred.";
}