import { useTranslation } from "react-i18next";

import useCMCStore from "src/stores/CMCStore";
import useHistoryStore from "src/stores/historyStore";
import useFileExplorerState from "src/stores/FileExplorerStore";
import { deleteFile, openInExplorer } from "src/tauriCLIWrapper/invoke";

export default function createCTXMenuSections(): MenuSections {
    const { setModal } = useCMCStore(state => state);
    const { setCurrentEditingFile } = useFileExplorerState(state => state);
    const { pushRoute, currentPath } = useHistoryStore(state => state);

    const { t } = useTranslation();

    return {
        disk: [
            {
                name: t('ctx.buttons.open'),
                onClick: info => pushRoute(info),
                type: 'action'
            },
            {
                name: t('ctx.buttons.openInExplorer'),
                onClick: info => openInExplorer(info)/* window.electronAPI.openInExplorer(info) */,
                type: 'action'
            }
        ],
        file: [
            {
                name: t('ctx.buttons.open'),
                onClick: info => console.log(info)/* window.electronAPI.openFile(`${currentPath}\\${info}`) */,
                type: 'action'
            },
            {
                name: t('ctx.buttons.delete'),
                onClick: info => deleteFile(`${currentPath}\\${info}`)/* window.electronAPI.deleteFile(`${currentPath}\\${info}`) */,
                type: 'action'
            },
            {
                name: t('ctx.buttons.rename'),
                onClick: (info) => setCurrentEditingFile(info),
                type: 'action'
            }
        ],
        directory: [
            {
                name: t('ctx.buttons.open'),
                onClick: info => {
                    const path = `${currentPath}\\${info}`;
                    pushRoute(path);
                },
                type: 'action'
            },
            {
                name: t('ctx.buttons.delete'),
                onClick: info => deleteFile(`${currentPath}\\${info}`),
                type: 'action'
            },
            {
                name: t('ctx.buttons.rename'),
                onClick: (info) => setCurrentEditingFile(info),
                type: 'action'
            },
            {
                name: t('ctx.buttons.openInExplorer'),
                onClick: info => openInExplorer(info),
                type: 'action'
            }
        ],
        explorer: [
            {
                type: 'section',
                name: t('ctx.buttons.appearance'),
                children: [
                    {
                        type: 'action',
                        name: 'list',
                        onClick: () => console.log('table'),
                    },
                    {
                        type: 'action',
                        name: 'grid',
                        onClick: () => console.log('grid')
                    }
                ]
            },
            {
                name: t('ctx.buttons.createFolder'),
                onClick: () => setModal({
                    name: 'fileCreating',
                    data: {
                        path: currentPath,
                        type: 'folder'
                    }
                }),
                type: 'action'
            },
            {
                name: t('ctx.buttons.createFile'),
                onClick: () => setModal({
                    name: 'fileCreating',
                    data: {
                        path: currentPath,
                        type: 'file'
                    }
                }),
                type: 'action'
            },
            {
                name: t('ctx.buttons.openInExplorer'),
                onClick: (info) => openInExplorer(info),
                type: 'action'
            }
        ]
    };
}