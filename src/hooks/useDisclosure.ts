import { useState } from "react";

export const useDisclosure = () => {
    const [value, setValue] = useState(false);

    const setTrue = () => setValue(true);
    const setFalse = () => setValue(false);
    const toggleValue = () => setValue(prev => !prev);

    return { value, setValue, setFalse, setTrue, toggleValue };
};
