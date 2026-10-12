import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/base.css";
import "./styles/header.css";
import "./styles/matchup.css";
import "./styles/controls.css";
import "./styles/analysis.css";
import "./styles/rail.css";
import "./styles/modal.css";
import "./styles/v3.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
