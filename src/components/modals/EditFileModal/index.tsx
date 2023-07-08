import React from "react";
import Modal from "react-modal";
import { sep } from "@tauri-apps/api/path";
import { useForm, SubmitHandler } from "react-hook-form";

import { rename } from "@tauriAPI";
import { isErrorMessage } from "@utils";
import { useEditFileModalStore, useExplorerHistory, useNotificationStore } from "@zustand";

import styles from "./EditFileModal.module.scss";

type Inputs = {
    filename: string;
}

const EditFileModal: React.FC = () => {
    const { currentPath } = useExplorerHistory();
    const { addNotification } = useNotificationStore();
    const { closeModal, isOpened, editFilename } = useEditFileModalStore();

    const { register, formState: { errors }, handleSubmit } = useForm<Inputs>({
        defaultValues: {
            filename: editFilename
        },
        values: {
            filename: editFilename
        }
    });

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        const { filename } = data;

        if (filename === editFilename) {
            return closeModal();
        }

        const oldPathToFile = currentPath + sep + editFilename;
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

    return (
        <Modal
            isOpen={isOpened}
            onRequestClose={closeModal}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            shouldFocusAfterRender
            // shouldReturnFocusAfterClose
            overlayClassName={styles.overlay}
            className={styles.modalBody}
            portalClassName={styles.portal}
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            appElement={document.getElementById("modal-root")!}
        >
            <h2 className={styles.heading}>Editing &quot;{editFilename}&quot;</h2>

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <label className={styles.inputLabel}>
                    <p>Name: </p>

                    <input
                        autoComplete="off"
                        className={styles.input}
                        {...register("filename", {
                            required: true,
                            validate: (v) => {
                                const isNameTaken = document.querySelector(`[data-context-menu-additional-info-lowercased="${v.toLowerCase()}"]`);
                                const isEqualsSelf = editFilename === v;

                                if (isNameTaken && !isEqualsSelf) {
                                    return "This name is already taken";
                                }
                            }
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