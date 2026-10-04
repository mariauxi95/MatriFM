import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // matrimarifer.com is served at the domain root.
  base: "/",
  plugins: [react()],
  server: {
    watch: {
      // Windows locks a film while it plays and crashes the file watcher.
      // Files added here are served after the dev server restarts.
      ignored: ["**/public/videos/**"],
    },
  },
});
