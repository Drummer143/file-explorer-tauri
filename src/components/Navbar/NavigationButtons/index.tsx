import React from "react";
import { useTranslation } from "react-i18next";

import { useExplorerHistory } from "@zustand";
import { LeftArrowSVG, ReloadSVG, RightArrowSVG, UpArrowSVG } from "@assets";

import styles from "./NavigationButtons.module.scss";

const NavigationButtons: React.FC = () => {
    const { canGoBack, canGoForward, goBack, goForward, goToParent, hasParent } = useExplorerHistory();

    const { t } = useTranslation("translation", { keyPrefix: "navbar" });

    const handleReload = () => location.reload();

    return (
        <div className={styles.wrapper}>
            <button className={styles.button} title={t("back")} onClick={goBack} disabled={!canGoBack}>
                <LeftArrowSVG />
            </button>

            <button className={styles.button} title={t("forward")} onClick={goForward} disabled={!canGoForward}>
                <RightArrowSVG />
            </button>

            <button className={styles.button} title={t("reload")} onClick={handleReload}>
                <ReloadSVG />
            </button>

            <button className={styles.button} title={t("goToParentFolder")} onClick={goToParent} disabled={!hasParent}>
                <UpArrowSVG />
            </button>
        </div>
    );
};

export default NavigationButtons;
