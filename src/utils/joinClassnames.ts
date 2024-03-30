export const joinCN = (...classNames: (string | string[] | undefined | boolean)[]): string => {
    return classNames
        .filter(Boolean)
        .join(" ");
};
