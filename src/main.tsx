import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";

import "./i18n";

import "./style.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
