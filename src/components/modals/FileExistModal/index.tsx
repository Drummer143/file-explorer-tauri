import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";
import { useTranslation } from "react-i18next";
import { sep } from "@tauri-apps/api/path";

import { addIndexToFilename } from "@tauriAPI";
import { pasteFile } from "@utils";

import styles from "./FileExistModal.module.scss";

const FileExistModal: React.FC = () => {
    const { t } = useTranslation();

    const [fileInfo, setFileInfo] = useState<CustomEventMap["openExistFileModal"]["detail"] | undefined>(undefined);

    const closeModal = () => setFileInfo(undefined);

    const handleClick = async (action: "overwrite" | "save-both" | "cancel" | "merge") => {
        if (action === "cancel" || !fileInfo) {
            return closeModal();
        }

        const options: FileCopyOptions = {
            skipExist: false,
            overwrite: false
        };

        let filename = fileInfo.filename;

        switch (action) {
            case "overwrite":
                options.overwrite = true;
                break;
            case "save-both":
                filename = await addIndexToFilename(fileInfo.dirname + sep + fileInfo.filename);
                break;
            case "merge":
                options.skipExist = true;
        }

        pasteFile({ dirname: fileInfo.dirname, filename }, options);

        closeModal();
    };

    const handleAfterOpen = () => document.documentElement.dataset.modalOpened = "true";

    const handleAfterClose = () => document.documentElement.removeAttribute("data-modal-opened");

    useEffect(() => {
        const handleOpenModal = (e: CustomEventMap["openExistFileModal"]) => {
            setFileInfo(e.detail);
        };

        document.addEventListener("openExistFileModal", handleOpenModal);

        return () => {
            document.removeEventListener("openExistFileModal", handleOpenModal);
        };
    }, []);

    return (
        <ReactModal
            isOpen={!!fileInfo}
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
                    filename: fileInfo?.filename.split(sep).at(-1),
                    targetFolder: fileInfo?.dirname || "this folder"
                })}
            </p>

            <div
                className={styles.actionButtons}
                style={{
                    "--count-of-columns": fileInfo?.filetype === "file" ? "3" : "4",
                } as React.CSSProperties}
            >
                {fileInfo?.filetype === "folder" && (
                    <button onClick={() => handleClick("merge")} type="button">
                        {t("modals.fileExistModal.merge")}
                    </button>
                )}
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
