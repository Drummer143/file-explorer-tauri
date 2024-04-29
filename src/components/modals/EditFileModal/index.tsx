import Modal from "react-modal";
import React, { useEffect, useRef, useState } from "react";
import { sep } from "@tauri-apps/api/path";
import { useForm } from "react-hook-form";

import { createFile, rename } from "@tauriAPI";
import { useDisclosure } from "@hooks";
import { addNotificationFromError } from "@utils";

import styles from "./EditFileModal.module.scss";
import { useTranslation } from "react-i18next";

type FormValues = {
    filename: string;
    extension: string;
};

const CreateFileModal: React.FC = () => {
    const { t } = useTranslation("translation", { keyPrefix: "modals.editFileModal" });
    const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useDisclosure();

    const [filetype, setFiletype] = useState<"file" | "folder">("file");
    const [isExtensionInputHidden, setIsExtensionInputHidden] = useState(true);

    const targetFile = useRef<{ filename?: string; dirname: string } | undefined>(undefined);

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

    const mergeFilename = (filename: string, extension: string) => {
        if (extension) {
            extension = "." + extension;
        }

        return filename + extension;
    };

    const handleAfterOpen = () => (document.documentElement.dataset.modalOpened = "true");

    const handleAfterClose = () => {
        reset();

        targetFile.current = undefined;

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
            return t("errors.emptyName");
        }

        const mergedFilename = mergeFilename(filename, extension).toLowerCase();

        if (mergedFilename === targetFile.current?.filename) {
            return;
        }

        const selector = `[data-filename-lowercased="${mergedFilename}"]`;
        const exists = document.querySelector(selector);

        if (exists) {
            return t("errors.alreadyTaken");
        }
    };

    const onSubmit = async ({ extension = "", filename }: FormValues) => {
        const mergedFilename = mergeFilename(filename, extension);

        if (mergedFilename === targetFile.current?.filename) {
            return closeModal();
        }

        try {
            if (!targetFile.current) {
                throw "Don't know dirname of file";
            }

            if (targetFile.current?.filename) {
                const from = targetFile.current.dirname + sep() + targetFile.current.filename;
                const to = targetFile.current.dirname + sep() + mergedFilename;

                rename(from, to).catch(addNotificationFromError);
            } else {
                createFile(targetFile.current.dirname + sep() + mergedFilename, filetype);
            }
        } catch (error) {
            addNotificationFromError(error);
        }

        closeModal();
    };

    useEffect(() => {
        const handleOpenCreateFIleModal: DocumentEventHandler<"openEditFileModal"> = e => {
            if (e.detail.filetype === "file") {
                setIsExtensionInputHidden(false);
            }

            targetFile.current = e.detail;

            if (e.detail.filename) {
                const hasExtension = e.detail.filename.includes(".") && !e.detail.filename.startsWith(".");

                if (e.detail.filetype === "file" && hasExtension) {
                    const filenameParts = e.detail.filename.split(".");

                    setValue("filename", filenameParts.slice(0, -1).join("."));
                    setValue("extension", filenameParts.slice(-1)[0]);
                } else {
                    setValue("filename", e.detail.filename);
                }
            }

            setFiletype(e.detail.filetype);
            openModal();
        };

        document.addEventListener("openEditFileModal", handleOpenCreateFIleModal);

        return () => {
            document.removeEventListener("openEditFileModal", handleOpenCreateFIleModal);
        };
    }, [openModal, setValue]);

    return (
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
            <h2 className={styles.heading}>
                {targetFile.current?.filename
                    ? t("editingHeading", { filename: targetFile.current.filename })
                    : t(`${filetype}CreatingHeading`)}
            </h2>

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
                            autoFocus
                            autoComplete="new-password"
                            className={styles.input}
                        />

                        <p className={styles.inputDescription}>{t("nameInputLabel")}</p>
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

                        <p className={styles.inputDescription}>{t("extensionInputLabel")}</p>
                    </div>

                    <p className={styles.filenameInputsError}>{errors.filename?.message}</p>
                </div>

                <button type="submit" className={styles.submitButton}>
                    {t("submitButton")}
                </button>
            </form>
        </Modal>
    );
};

export default CreateFileModal;
