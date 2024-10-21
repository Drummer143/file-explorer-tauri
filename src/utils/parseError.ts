const parseErrorRecursion = (error: unknown, startTime: number): string | undefined => {
    if (Date.now() - startTime > 500) {
        return undefined;
    }
    if (!error) {
        return undefined;
    } else if (typeof error === "string") {
        return error;
    } else if (error instanceof Error) {
        return error.message;
    } else if (typeof error === "object") {
        const keys = Object.keys(error);
        const messageKey = keys.find(key => key.toLowerCase().includes("message"));

        if (messageKey) {
            return error[messageKey as keyof typeof error];
        }

        for (const key in keys) {
            return parseErrorRecursion(error[key as keyof typeof error], startTime);
        }
    }
};

export const parseError = (error: unknown) => {
    return parseErrorRecursion(error, Date.now());
};
