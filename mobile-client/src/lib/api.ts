import axios from "axios";

const API_BASE = "https://michelstravel.agency";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: {
    "x-michels-client": "mobile-consumer",
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Simple retry on network timeout
    if (error.code === "ECONNABORTED") {
      return api.request(error.config);
    }
    return Promise.reject(error);
  },
);
