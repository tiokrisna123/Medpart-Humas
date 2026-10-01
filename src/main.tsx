import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { MemberProvider } from "./lib/MemberContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MemberProvider>
        <App />
      </MemberProvider>
    </BrowserRouter>
  </React.StrictMode>,
);