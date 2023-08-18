export default {
    translation: {
        navbar: {
            back: "Вперёд",
            forward: "Назад",
            goToParentFolder: "Перейти к родительской папке",
            reload: "Обновить"
        },
        windowControlButtons: {
            minimize: "Свернуть",
            restoreToWindow: "Свернуть в окно",
            maximize: "Развернуть",
            close: "Закрыть"
        },
        ctx: {
            paste: "Вставить",
            copy: "Копировать",
            cut: "Вырезать",
            openInNativeExplorer: "Открыть в проводнике",
            showInNativeExplorer: "Показать в проводнике",
            open: "Открыть",
            delete: "Удалить",
            rename: "Переименовать",
            createNewFile: "Создать новый файл",
            createNewFolder: "Создать новую папку"
        },
        clipboardTrackers: {
            copyingFileFromTo: "Копирование {{filename}} из {{from}} в {{to}}",
            movingFileFromTo: "Перемещение {{filename}} из {{from}} в {{to}}",
            cancel: "Отменить копирование",
            continue: "Продолжить копирование",
            pause: "Приостановить копирование",
            deleteCopiedFile: "Удалить копированный файл?",
            deleteFile: "Удалить файл",
            saveFile: "Оставить файл",
            overwrite: "Перезаписать",
            saveBoth: "Сохранить оба файла",
            merge: "Объединить",
            doThisForAllFiles: "Выполнить действие для всех файлов",
            preparingToCopyFolder: "Подготовка",
            actionRequired: "Требуется действие"
        },
        modals: {
            editFileModal: {
                editingHeading: "Редактирование {{filename}}",
                nameInputLabel: "Имя",
                extensionInputLabel: "Расширение",
                fileCreatingHeading: "Создание нового файла",
                folderCreatingHeading: "Создание новой папки",
                submitButton: "Сохранить",
                errors: {
                    alreadyTaken: "Это имя уже занято",
                    emptyName: "Имя файла не может быть пустым"
                }
            },
            fileExistModal: {
                modalText: "{{filename}} уже существует в папке {{targetFolder}}. Выберите действие:",
                overwrite: "Перезаписать",
                saveBoth: "Сохранить оба файла",
                merge: "Объединить"
            }
        },
        notifications: {
            error: "Ошибка",
            info: "Уведомление",
            warning: "Внимание"
        },
        save: "Сохранить",
        cancel: "Отменить",
        close: "Закрыть"
    }
};
