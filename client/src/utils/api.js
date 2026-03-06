const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }

  // Permite desplegar frontend y backend bajo el mismo dominio con proxy inverso.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
};

export const API_BASE_URL = getApiBaseUrl();
