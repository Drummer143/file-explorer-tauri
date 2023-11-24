import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import "overlayscrollbars/styles/overlayscrollbars.css";
import "./style.scss";
import "./defaultColorTheme.scss";

import "./appConfig";

import App from "./App";
import i18n from "@i18n";
import ReactModal from "react-modal";

const root = document.getElementById("root") as HTMLElement;

ReactModal.setAppElement(root);

ReactDOM.createRoot(root).render(
    // <React.StrictMode>
    <I18nextProvider i18n={i18n}>
        <App />
    </I18nextProvider>
    // </React.StrictMode>
);
