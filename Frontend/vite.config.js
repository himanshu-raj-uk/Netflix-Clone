import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  base: "/Netflix-Clone/",

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    open: true,
  },
});