import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // .env と process.env（mise 経由の環境変数）を読み込む。process.env が優先
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.DEV_PORT) || 3999;

  return {
    plugins: [react()],
    server: {
      port,
      open: true,
    },
  };
});
