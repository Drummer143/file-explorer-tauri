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
