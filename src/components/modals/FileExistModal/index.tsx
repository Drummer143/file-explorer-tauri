import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";
import { sep, extname, basename } from "@tauri-apps/api/path";

import { pathExists } from "@tauriAPI";
import { usePasteFile } from "@hooks";
import { dispatchCustomEvent } from "@utils";

import styles from "./FileExistModal.module.scss";

const FileExistModal: React.FC = () => {
    const [pathInfo, setPathInfo] = useState<CustomEventMap["openExistFileModal"]["detail"] | undefined>(undefined);

    const closeModal = () => setPathInfo(undefined);

    const pasteFile = usePasteFile();

    const addIndexToFilename = async (pathInfo: CustomEventMap["openExistFileModal"]["detail"]) => {
        let currentNumber = 1;
        let ext: string;

        try {
            ext = "." + (await extname(pathInfo.filename));
        } catch (error) {
            ext = "";
        }

        const filenameNoExt = await basename(pathInfo.filename, ext);

        const concatIndex = () => filenameNoExt + ` (${currentNumber})` + ext;
        const concatPath = () => pathInfo.dirname + sep + filename;

        let filename = concatIndex();
        let numberedPath = concatPath();

        while (await pathExists(numberedPath)) {
            currentNumber++;
            filename = concatIndex();
            numberedPath = concatPath();
        }

        return filename;
    };

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
            filename = await addIndexToFilename(pathInfo);
        } else {
            options.overwrite = true;
        }

        const filetype = document.documentElement.dataset.copiedFileType;

        if (filetype === "file") {
            pasteFile({ dirname: pathInfo.dirname, filename }, options);
        } else {
            dispatchCustomEvent("addNotification", { message: "Can copy only files", type: "error" });
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
            <p>
                {pathInfo?.filename.split(sep).at(-1)} already exists in {pathInfo?.dirname}. Choose an action:
            </p>

            <div className={styles.actionButtons}>
                <button onClick={() => handleClick("overwrite")} type="button">
                    Overwrite
                </button>
                <button onClick={() => handleClick("save-both")} type="button">
                    Save both
                </button>
                <button onClick={() => handleClick("cancel")} type="button">
                    Cancel
                </button>
            </div>
        </ReactModal>
    );
};

export default FileExistModal;
