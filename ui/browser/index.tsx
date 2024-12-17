import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/styles.css";

const rootElement = document.getElementById("root");
if (rootElement) {
    console.log("Found root!");
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
} else {
    console.error("Root element not found!");
}
