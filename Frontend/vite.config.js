import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const BASE = "Netflix-Clone";

const redirectToBase = () => ({
  name: "redirect-to-base",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const isPage = req.headers.accept?.includes("text/html");
      if (isPage && req.url && !req.url.startsWith(BASE)) {
        res.statusCode = 302;
        res.setHeader("Location", BASE.replace(/\/$/, "") + req.url);
        res.end();
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), redirectToBase()],
  base: BASE,
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    open: BASE, 
  },
});