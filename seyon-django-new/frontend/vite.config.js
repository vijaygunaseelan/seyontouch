import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to the Django dev server during `npm run dev`,
      // so the app never needs to deal with CORS.
      "/api": "http://127.0.0.1:8000",
    },
  },
});
