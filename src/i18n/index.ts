import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./localizations/en";
import ru from "./localizations/ru";

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: false,
        fallbackLng: ["en", "ru"],
        interpolation: {
            escapeValue: false
        },
        resources: {
            en,
            ru
        }
    });

export default i18n;
