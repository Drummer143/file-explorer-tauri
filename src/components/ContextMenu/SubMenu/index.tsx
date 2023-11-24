import React, { useEffect, useRef, useState } from "react";

import styles from "../ContextMenu.module.scss";

type CTXSubMenuPositionTuple = ["left" | "right", "top" | "bottom"];

interface SubMenuProps {
    title: string;

    children?: React.ReactNode;
}

const SubMenu: React.FC<SubMenuProps> = ({ children, title }) => {
    const [isMenuOpened, setIsMenuOpened] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [position, setPosition] = useState<CTXSubMenuPositionTuple>(["right", "bottom"]);

    const ctxContainerRef = useRef<HTMLDivElement | null>(null);
    const beforeCloseTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter: React.MouseEventHandler<HTMLDivElement> = () => {
        if (beforeCloseTimeout.current) {
            clearTimeout(beforeCloseTimeout.current);
            beforeCloseTimeout.current = null;
        }

        setIsMenuOpened(true);
    };

    const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
        beforeCloseTimeout.current = setTimeout(() => {
            setIsMenuOpened(false);
            setPosition(["right", "bottom"]);
        }, 1000);
    };

    useEffect(() => {
        if (!isMenuOpened || !children) {
            return;
        }

        const boundingRect = ctxContainerRef.current?.getBoundingClientRect();

        if (!boundingRect) {
            return;
        }

        const { bottom, right } = boundingRect;
        const newPosition: typeof position = ["right", "bottom"];

        if (document.body.clientWidth < right) {
            newPosition[0] = "left";
        }

        if (document.body.clientHeight < bottom) {
            newPosition[1] = "top";
        }

        setPosition(newPosition);
    }, [children, isMenuOpened]);

    if (!children) {
        return;
    }

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
            <p className={styles.submenuTitle}>{title}</p>

            {isMenuOpened && (
                <div
                    ref={ctxContainerRef}
                    className={"absolute w-full ".concat(
                        styles.wrapper,
                        position[0] === "right" ? " right-0 translate-x-full" : " left-0 -translate-x-full",
                        position[1] === "top" ? " bottom-0" : " top-0"
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default SubMenu;
