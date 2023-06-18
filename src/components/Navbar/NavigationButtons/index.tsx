import React from 'react';
import { useTranslation } from 'react-i18next';

import { useExplorerHistory } from '../../../zustand';
import { LeftArrowSVG, ReloadSVG, RightArrowSVG } from '../../../assets/other';

import styles from "./NavigationButtons.module.scss";

const NavigationButtons: React.FC = () => {
    const { canGoBack, canGoForward, goBack, goForward } = useExplorerHistory();

    const { t } = useTranslation();

    const handleReload = () => location.reload();

    return (
        <div className={styles.wrapper}>
            <button className={styles.button} title={t('navbar.back')} onClick={goBack} disabled={!canGoBack}>
                <LeftArrowSVG />
            </button>

            <button className={styles.button} title={t('navbar.forward')} onClick={goForward} disabled={!canGoForward}>
                <RightArrowSVG />
            </button>

            <button className={styles.button} title='Reload page. You can also reload page by pressing "Right Control + R"' onClick={handleReload}>
                <ReloadSVG />
            </button>
        </div>
    )
}

export default NavigationButtons;
