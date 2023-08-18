import Modal from "react-modal";
import React, { useEffect, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { useForm } from "react-hook-form";

import { createFile } from "@tauriAPI";
import { useDisclosure } from "@hooks";
import { useExplorerHistory } from "@zustand";
import { addNotificationFromError } from "@utils";

import styles from "./CreateFileModal.module.scss";

type FormValues = {
    filename: string;
    extension: string;
};

const CreateFileModal: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useDisclosure();
    const [filetype, setFiletype] = useState<"file" | "folder">("file");
    const [isExtensionInputHidden, setIsExtensionInputHidden] = useState(true);

    const {
        register,
        setValue,
        getValues,
        formState: { errors },
        reset,
        handleSubmit
    } = useForm<FormValues>({
        defaultValues: {
            filename: "",
            extension: ""
        },
        values: {
            extension: "",
            filename: ""
        },
        mode: "all"
    });

    const handleAfterOpen = () => (document.documentElement.dataset.modalOpened = "true");

    const handleAfterClose = () => {
        reset();

        document.documentElement.removeAttribute("data-modal-opened");
    };

    const handleFilenameInputChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        const value = e.target.value;

        if (value.includes(".")) {
            setIsExtensionInputHidden(true);
        } else {
            setIsExtensionInputHidden(false);
        }

        setValue("filename", value);
    };

    const handleCustomValidation = () => {
        const { extension, filename } = getValues();

        if (!extension && !filename) {
            return "Name or extension must be filled";
        }

        const selector = `[data-filename-lowercased="${filename}${extension ? "." + extension : ""}"]`;
        const exists = document.querySelector(selector);

        if (exists) {
            return "This name is already busy.";
        }
    };

    const onSubmit = async ({ extension, filename }: FormValues) => {
        if (extension) {
            extension = "." + extension;
        }

        const pathToFile = currentPath + sep + filename + extension;

        try {
            createFile(pathToFile, filetype);
        } catch (error) {
            addNotificationFromError(error);
        }

        closeModal();
    };

    useEffect(() => {
        const handleOpenCreateFIleModal: CustomEventHandler<"openCreateFIleModal"> = e => {
            if (e.detail === "file") {
                setIsExtensionInputHidden(false);
            }

            setFiletype(e.detail);
            openModal();
        };

        document.addEventListener("openCreateFIleModal", handleOpenCreateFIleModal);

        return () => {
            document.removeEventListener("openCreateFIleModal", handleOpenCreateFIleModal);
        };
    }, [openModal]);

    return (
        // TODO: LOCALIZATION
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            onAfterOpen={handleAfterOpen}
            onAfterClose={handleAfterClose}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            shouldFocusAfterRender
            // shouldReturnFocusAfterClose
            overlayClassName={styles.overlay}
            className={styles.modalBody}
            portalClassName={styles.portal}
        >
            <h2 className={styles.heading}>Creating new {filetype}</h2>

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <div
                    className={styles.filenameInputsLabel.concat(
                        !isExtensionInputHidden && filetype === "file" ? "" : ` ${styles.extensionInputHidden}`
                    )}
                >
                    <div className={styles.inputContainer}>
                        <input
                            {...register("filename", {
                                onChange: handleFilenameInputChange,
                                validate: handleCustomValidation
                            })}
                            autoComplete="new-password"
                            className={styles.input}
                        />

                        <p className={styles.inputDescription}>Name</p>
                    </div>

                    <div className={`${styles.extensionInputLabel} ${styles.inputContainer}`}>
                        <input
                            {...register("extension", {
                                disabled: isExtensionInputHidden || filetype === "folder",
                                validate: handleCustomValidation
                            })}
                            autoComplete="new-password"
                            className={styles.input}
                        />

                        <p className={styles.inputDescription}>Extension</p>
                    </div>

                    <p className={styles.filenameInputsError}>{errors.filename?.message}</p>
                </div>

                <button type="submit" className={styles.submitButton}>
                    Create {filetype}
                </button>
            </form>
        </Modal>
    );
};

export default CreateFileModal;
