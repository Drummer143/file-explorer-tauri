import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { sep } from "@tauri-apps/api/path";
import { useTranslation } from "react-i18next";
import { useForm, SubmitHandler } from "react-hook-form";

import { rename } from "@tauriAPI";
import { useDisclosure } from "@hooks";
import { useExplorerHistory } from "@zustand";
import { addNotificationFromError } from "@utils";

import styles from "./EditFileModal.module.scss";

type Inputs = {
    filename: string;
};

const EditFileModal: React.FC = () => {
    const { currentPath } = useExplorerHistory();

    const { t } = useTranslation();

    const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useDisclosure();

    const [currentFilename, setCurrentFilename] = useState<string | undefined>();

    const {
        register,
        formState: { errors },
        handleSubmit,
        setValue
    } = useForm<Inputs>({
        defaultValues: {
            filename: ""
        },
        values: {
            filename: ""
        }
    });

    const onSubmit: SubmitHandler<Inputs> = data => {
        const { filename } = data;

        if (filename === currentFilename) {
            return closeModal();
        }

        const oldPathToFile = currentPath + sep + currentFilename;
        const newPathToFile = currentPath + sep + filename;

        rename(oldPathToFile, newPathToFile).catch(addNotificationFromError);

        closeModal();
    };

    const handleCustomValidate = (value: string) => {
        const selector = `[data-filename-lowercased="${value.toLowerCase()}"]`;
        const elementWithGivenFilename = document.querySelector(selector);
        const isEqualsSelf = currentFilename === value;

        if (elementWithGivenFilename && !isEqualsSelf) {
            return "This name is already taken";
        }
    };

    const handleAfterOpen = () => (document.documentElement.dataset.modalOpened = "true");

    const handleAfterClose = () => document.documentElement.removeAttribute("data-modal-opened");

    useEffect(() => {
        const handleOpenModal = (e: CustomEventMap["openEditFileModal"]) => {
            setCurrentFilename(e.detail.filename);
            setValue("filename", e.detail.filename, { shouldDirty: true, shouldTouch: false, shouldValidate: false });
            openModal();
        };

        document.addEventListener("openEditFileModal", handleOpenModal);

        return () => {
            document.removeEventListener("openEditFileModal", handleOpenModal);
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
            <h2 className={styles.heading}>{t("modals.editFileModal.heading", { filename: currentFilename })}</h2>

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <label className={styles.inputLabel}>
                    <p className={styles.inputDescription}>{t("modals.editFileModal.nameInputLabel")}: </p>

                    <input
                        autoComplete="new-password"
                        className={styles.input}
                        {...register("filename", {
                            required: true,
                            validate: handleCustomValidate
                        })}
                    />

                    {errors.filename && (
                        <p>
                            {errors.filename.type} - {errors.filename.message}
                        </p>
                    )}
                </label>

                <button className={styles.submitButton} type="submit">
                    {t("save")}
                </button>
            </form>
        </Modal>
    );
};

export default EditFileModal;
