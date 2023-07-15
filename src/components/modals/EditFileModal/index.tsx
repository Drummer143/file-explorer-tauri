import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { sep } from "@tauri-apps/api/path";
import { useForm, SubmitHandler } from "react-hook-form";

import { rename } from "@tauriAPI";
import { isErrorMessage } from "@utils";
import { useExplorerHistory, useNotificationStore } from "@zustand";

import styles from "./EditFileModal.module.scss";
import { useDisclosure } from "@hooks";

type Inputs = {
    filename: string;
}

const EditFileModal: React.FC = () => {
    const { currentPath } = useExplorerHistory();
    const { addNotification } = useNotificationStore();

    const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useDisclosure();

    const [currentFilename, setCurrentFilename] = useState<string | undefined>();

    const { register, formState: { errors }, handleSubmit, setValue } = useForm<Inputs>({
        defaultValues: {
            filename: ""
        },
        values: {
            filename: ""
        }
    });

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        const { filename } = data;

        if (filename === currentFilename) {
            return closeModal();
        }

        const oldPathToFile = currentPath + sep + currentFilename;
        const newPathToFile = currentPath + sep + filename;

        console.log(oldPathToFile, newPathToFile);

        try {
            await rename(oldPathToFile, newPathToFile);
        } catch (error) {
            console.log(error);
            if (isErrorMessage(error)) {
                if (!isErrorMessage(error)) {
                    return;
                }

                const message = error.message || error.error || "Unexpected error";
                const reason = error.message && error.error ? error.error : undefined;

                addNotification({ message, type: "error", reason });
            } else if (typeof error === "string") {
                addNotification({ type: "error", message: error });
            }
        }

        closeModal();
    };

    const handleCustomValidate = (value: string) => {
        const selector = `[data-context-menu-additional-info-lowercased="${value.toLowerCase()}"]`;
        const elementWithGivenFilename = document.querySelector(selector);
        const isEqualsSelf = currentFilename === value;

        if (elementWithGivenFilename && !isEqualsSelf) {
            return "This name is already taken";
        }
    };

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
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            shouldFocusAfterRender
            // shouldReturnFocusAfterClose
            overlayClassName={styles.overlay}
            className={styles.modalBody}
            portalClassName={styles.portal}
        >
            <h2 className={styles.heading}>Editing &quot;{currentFilename}&quot;</h2>

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <label className={styles.inputLabel}>
                    <p>Name: </p>

                    <input
                        autoComplete="off"
                        className={styles.input}
                        {...register("filename", {
                            required: true,
                            validate: handleCustomValidate
                        })}
                    />

                    {errors.filename && <p>{errors.filename.type} - {errors.filename.message}</p>}
                </label>

                <button className={styles.submitButton} type="submit">Save</button>
            </form>
        </Modal >
    );
};

export default EditFileModal;