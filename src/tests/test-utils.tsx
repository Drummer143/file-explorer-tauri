import React from "react";
import { I18nextProvider } from "react-i18next";
import { render, RenderOptions } from "@testing-library/react";

import i18n from "../i18n/index.js";

import "@testing-library/jest-dom";

import "vitest-dom/extend-expect.js";

i18n.changeLanguage("en");

vi.mock("zustand");

type AllProvidersProps = {
    children: React.ReactNode;
};

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
    render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
