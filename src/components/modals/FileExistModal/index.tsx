import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";
import { useTranslation } from "react-i18next";
import { sep, extname, basename } from "@tauri-apps/api/path";

import { addIndexToFilename, pathExists } from "@tauriAPI";
import { dispatchCustomEvent, pasteFile } from "@utils";

import styles from "./FileExistModal.module.scss";

const FileExistModal: React.FC = () => {
    const { t } = useTranslation();

    const [pathInfo, setPathInfo] = useState<CustomEventMap["openExistFileModal"]["detail"] | undefined>(undefined);

    const closeModal = () => setPathInfo(undefined);

    const handleClick = async (action: "overwrite" | "save-both" | "cancel") => {
        if (action === "cancel" || !pathInfo) {
            return closeModal();
        }

        const options: FileCopyOptions = {
            skipExist: false,
            overwrite: false
        };

        let filename = pathInfo.filename;

        if (action === "save-both") {
            filename = await addIndexToFilename(pathInfo.dirname + sep + pathInfo.filename);
        } else {
            options.overwrite = true;
        }

        pasteFile({ dirname: pathInfo.dirname, filename }, options);

        closeModal();
    };

    const handleAfterOpen = () => (document.documentElement.dataset.modalOpened = "true");

    const handleAfterClose = () => document.documentElement.removeAttribute("data-modal-opened");

    useEffect(() => {
        const handleOpenModal = (e: CustomEventMap["openExistFileModal"]) => {
            setPathInfo(e.detail);
        };

        document.addEventListener("openExistFileModal", handleOpenModal);

        return () => {
            document.removeEventListener("openExistFileModal", handleOpenModal);
        };
    }, []);

    return (
        <ReactModal
            isOpen={!!pathInfo}
            onRequestClose={closeModal}
            onAfterOpen={handleAfterOpen}
            onAfterClose={handleAfterClose}
            shouldCloseOnEsc
            shouldFocusAfterRender
            shouldCloseOnOverlayClick
            overlayClassName={styles.overlay}
            className={styles.modalBody}
            portalClassName={styles.portal}
        >
            <p>
                {t("modals.fileExistModal.modalText", {
                    filename: pathInfo?.filename.split(sep).at(-1),
                    targetFolder: pathInfo?.dirname || "this folder"
                })}
            </p>

            <div className={styles.actionButtons}>
                <button onClick={() => handleClick("overwrite")} type="button">
                    {t("modals.fileExistModal.overwrite")}
                </button>
                <button onClick={() => handleClick("save-both")} type="button">
                    {t("modals.fileExistModal.saveBoth")}
                </button>
                <button onClick={() => handleClick("cancel")} type="button">
                    {t("cancel")}
                </button>
            </div>
        </ReactModal>
    );
};

export default FileExistModal;
