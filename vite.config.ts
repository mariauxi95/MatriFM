import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves under /MatriFM/; keep "/" for local `npm run dev`.
  base: mode === "production" ? "/MatriFM/" : "/",
  plugins: [react()],
  server: {
    watch: {
      // Windows locks the intro film while it plays and crashes the file watcher.
      ignored: ["**/public/videos/**"],
    },
  },
}));
