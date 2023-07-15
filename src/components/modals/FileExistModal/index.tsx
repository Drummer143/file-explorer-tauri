import React, { useCallback, useEffect, useState } from "react";
import ReactModal from "react-modal";
import { sep } from "@tauri-apps/api/path";

import { pathExists } from "@tauriAPI";
import { usePasteFile } from "@hooks";
import { useNotificationStore } from "@zustand";

import styles from "./FileExistModal.module.scss";

const FileExistModal: React.FC = () => {
    const { addNotification } = useNotificationStore();

    const [pathInfo, setPathInfo] = useState<CustomEventMap["openExistFileModal"]["detail"] | undefined>(undefined);

    const closeModal = () => setPathInfo(undefined);

    const pasteFile = usePasteFile();

    const handleRenameFile = useCallback(async () => {
        if (!pathInfo) {
            return;
        }

        let currentNumber = 1;
        let numberedPath = `${pathInfo.filename} (${currentNumber})`;
        let exists = true;

        while (exists) {
            if (await pathExists(numberedPath)) {
                currentNumber++;
                numberedPath = `${pathInfo.filename} (${currentNumber})`;
            } else {
                exists = false;
            }
        }

        return numberedPath;
    }, [pathInfo]);

    const handleClick = async (action: "overwrite" | "save-both" | "cancel") => {
        if (action === "cancel" || !pathInfo) {
            return closeModal();
        }

        const options: FileCopyOptions = {
            skipExist: false,
            overwrite: false
        };

        let to = pathInfo.filename;

        if (action === "save-both") {
            const newName = await handleRenameFile();

            if(newName) {
                to = newName;
            }
        } else {
            options.overwrite = true;
        }

        const filetype = document.documentElement.dataset.copiedFileType;

        if (filetype === "file") {
            pasteFile({
                to,
                copyOptions: options
            })
                .then(res => console.log(res))
                .catch(error => console.error(error));
        } else {
            addNotification({ message: "Can copy only files", type: "error" });
        }

        closeModal();
    };

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
            shouldCloseOnEsc
            shouldFocusAfterRender
            shouldCloseOnOverlayClick
            overlayClassName={styles.overlay}
            className={styles.modalBody}
            portalClassName={styles.portal}
        >
            <p>{pathInfo?.filename.split(sep).at(-1)} already exists in {pathInfo?.dirname}. Choose an action:</p>

            <div className={styles.actionButtons}>
                <button onClick={() => handleClick("overwrite")} type="button">Overwrite</button>
                <button onClick={() => handleClick("save-both")} type="button">Save both</button>
                <button onClick={() => handleClick("cancel")} type="button">Cancel</button>
            </div>

        </ReactModal>
    );
};

export default FileExistModal;