import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split large third-party libs into their own long-cached chunks so
        // the app code (which changes often) stays small.
        manualChunks: {
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
})
