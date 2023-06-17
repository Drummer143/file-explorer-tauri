export const getDiskBackgroundColor = (value: number) => {
    value = value > 1 ? 1 : value < 0 ? 0 : value;

    const hue = (1 - value) * 120;

    return `hsl(${hue}, 50%, 35%)`;
}