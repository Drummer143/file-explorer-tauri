import React from "react";

import { CheckMarkSVG } from "@assets";

type MenuButtonProps = {
    selected?: boolean;
} & Omit<React.JSX.IntrinsicElements["button"], "aria-selected" | "disabled">;

const MenuButton: React.FC<MenuButtonProps> = ({ selected, children, ...props }) => {
    return (
        <button {...props} aria-selected={selected} disabled={selected}>
            {children}

            {selected && <CheckMarkSVG width={16} height={16} fill="#fff" />}
        </button>
    );
};

export default MenuButton;
