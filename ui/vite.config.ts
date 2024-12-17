import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    root: "./browser", // Ensure Vite starts in the correct directory
    build: {
        outDir: "../dist", // Output directory for builds
    },
    server: {
        port: 5173, // Default Vite port
        host: "0.0.0.0",
    },
});
