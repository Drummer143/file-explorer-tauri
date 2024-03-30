import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { parseError } from "@utils";
import { ReactErrorFallback } from "../types";

import styles from "./MainFallback.module.scss";
import { ChevronRightArrowSVG } from "@assets";

// eslint-disable-next-line react/prop-types
const MainFallbackScreen: ReactErrorFallback = ({ error }) => {
    const { t } = useTranslation("translation");

    const [showDetails, setShowDetails] = React.useState(false);

    const errorMessage = useMemo(() => parseError(error), [error]);

    const toggleDetails = () => setShowDetails(prev => !prev);

    const handleSideArrowKeydown: React.KeyboardEventHandler<HTMLButtonElement> = e => {
        if (e.code === "ArrowRight") {
            e.preventDefault();
            e.stopPropagation();
            setShowDetails(true);
        } else if (e.code === "ArrowLeft") {
            e.preventDefault();
            e.stopPropagation();
            setShowDetails(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>{t("errorHappened")}</h1>

            <div className={showDetails ? styles.opened : undefined}>
                <button
                    onKeyDown={handleSideArrowKeydown}
                    className={styles.openDetailsButton}
                    onClick={toggleDetails}
                >
                    <ChevronRightArrowSVG width={"14px"} height={"14px"} fill="#fff" />
                    <p>{t("showDetails")}</p>
                </button>
                <p className={styles.errorMessage}>{errorMessage}</p>
            </div>
        </div>
    );
};

export default MainFallbackScreen;
