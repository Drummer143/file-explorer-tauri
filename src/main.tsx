import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import "./style.scss";
import "./defaultColorTheme.scss";

import App from "./App";
import i18n from "@i18n";
import ReactModal from "react-modal";

ReactModal.setAppElement(document.getElementById("root") as HTMLElement);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    // <React.StrictMode>
    <I18nextProvider i18n={i18n}>
        <App />
    </I18nextProvider>
    // </React.StrictMode>
);
