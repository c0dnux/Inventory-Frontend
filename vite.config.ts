import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      port: 3001,
      proxy: {
        // Forward API calls to the Express backend in dev (avoids CORS).
        // Override the target with VITE_PROXY_TARGET in frontend/.env
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
