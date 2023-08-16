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
            rename: "Переименовать"
        },
        clipboardTrackers: {
            copyingFileFromTo: "Копирование {{filename}} из {{from}} в {{to}}",
            movingFileFromTo: "Перемещение {{filename}} из {{from}} в {{to}}",
            cancelCopying: "Отменить копирование",
            continueCopying: "Продолжить копирование",
            pauseCopying: "Приостановить копирование",
            deleteCopiedFile: "Удалить копированный файл?",
            deleteFile: "Удалить файл",
            saveFile: "Оставить файл"
        },
        modals: {
            editFileModal: {
                heading: "Редактирование {{filename}}",
                nameInputLabel: "Название файла"
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
} as LocalizationMap;
