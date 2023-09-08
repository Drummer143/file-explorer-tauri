import React, { useEffect, useRef, useState } from "react";
import ReactModal from "react-modal";
import { appWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { basename, dirname, sep } from "@tauri-apps/api/path";
import { UnlistenFn, Event as TauriEvent } from "@tauri-apps/api/event";

import { getFileType } from "@tauriAPI";
import { addNotificationFromError } from "@utils";

import styles from "./FileExistModal.module.scss";

const FileExistModal: React.FC = () => {
    const { t } = useTranslation();

    const [fileInfo, setFileInfo] = useState<RootFileExistsEventPayload | undefined>(undefined);

    const unlistenExistFile = useRef<UnlistenFn | null>(null);

    const closeModal = () => setFileInfo(undefined);

    const handleClick = async (action: "overwrite" | "saveBoth" | "skip" | "merge") => {
        appWindow.emit("file-exists-answer", action);

        closeModal();
    };

    const handleAfterOpen = () => (document.documentElement.dataset.modalOpened = "true");

    const handleAfterClose = () => document.documentElement.removeAttribute("data-modal-opened");

    useEffect(() => {
        const handleOpenModal = async (e: TauriEvent<PathsFromTo>) => {
            const dirnameTo = await dirname(e.payload.to);
            const filename = await basename(e.payload.from);
            const filetype = await getFileType(e.payload.from);

            if (filetype === "unknown") {
                return addNotificationFromError("Can't handle unknown file");
            }

            setFileInfo({
                dirname: dirnameTo,
                filename,
                filetype
            });
        };

        const mountListener = async () => {
            unlistenExistFile.current = await appWindow.listen("file-exists", handleOpenModal);
        };

        mountListener();

        return () => {
            if(unlistenExistFile.current) {
                unlistenExistFile.current();
            }
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
                style={
                    {
                        "--count-of-columns": fileInfo?.filetype === "file" ? "3" : "4"
                    } as React.CSSProperties
                }
            >
                {fileInfo?.filetype === "folder" && (
                    <button onClick={() => handleClick("merge")} type="button">
                        {t("modals.fileExistModal.merge")}
                    </button>
                )}
                <button onClick={() => handleClick("overwrite")} type="button">
                    {t("modals.fileExistModal.overwrite")}
                </button>
                <button onClick={() => handleClick("saveBoth")} type="button">
                    {t("modals.fileExistModal.saveBoth")}
                </button>
                <button onClick={() => handleClick("skip")} type="button">
                    {t("cancel")}
                </button>
            </div>
        </ReactModal>
    );
};

export default FileExistModal;
