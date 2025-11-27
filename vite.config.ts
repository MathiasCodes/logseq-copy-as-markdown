import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { logseqPlugin } from "vite-plugin-logseq";

export default defineConfig({
  plugins: [react(), logseqPlugin],
  base: "./",
  build: {
    target: "esnext",
    minify: "esbuild",
  },
});
