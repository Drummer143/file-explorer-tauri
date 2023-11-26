import { dispatchCustomEvent } from "./dom";

export const getDiskBackgroundColor = (value: number) => {
    value = value > 1 ? 1 : value < 0 ? 0 : value;

    const hue = (1 - value) * 120;

    return `hsl(${hue}, 50%, 35%)`;
};

export const isErrorMessage = (error: unknown): error is ErrorMessage => {
    if (typeof error === "object" && error && ("message" in error || "error" in error)) {
        return true;
    }

    return false;
};

export const addNotificationFromError = (
    error: ErrorMessage | unknown,
    type: "error" | "warn" | "info" = "error"
): Omit<AppNotification, "type"> | void => {
    if (isErrorMessage(error)) {
        const message = error.message || error.error || "Unexpected error";
        const reason = error.message && error.error ? error.error : undefined;

        dispatchCustomEvent("addNotification", { type, message, reason });
    } else if (typeof error === "string") {
        dispatchCustomEvent("addNotification", { type, message: error });
    }
};
