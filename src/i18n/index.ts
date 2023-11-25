import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./localizations/en";
import ru from "./localizations/ru";

export const supportedLanguages = ["en", "ru"] as const;

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: import.meta.env.DEV,
        fallbackLng: "en",
        supportedLngs: supportedLanguages,
        resources: {
            en,
            ru
        }
    });

export default i18n;
