import React, { useState, useEffect, FormEventHandler, KeyboardEventHandler } from 'react';

import xbytes from 'xbytes';
import GoogleIcon from '../GoogleIcon';
import useHistoryStore from 'src/stores/historyStore';
import useFileExplorerState from 'src/stores/FileExplorerStore';
import { rename } from 'src/tauriCLIWrapper/invoke';

type Props = {
    file: CFile;

    onDoubleClick: () => void;
};

enum Icons {
    file = 'draft',
    directory = 'folder'
}

function FileItem({ file, onDoubleClick }: Props) {
    const [isFile] = useState(!['disk', 'directory'].includes(file.type))
    const { currentPath } = useHistoryStore(state => state);
    const { currentEditingFile, setCurrentEditingFile } = useFileExplorerState(state => state)

    const [filenameInput, setFilenameInput] = useState(file.name);

    const handleRenameFile = () => {
        if (filenameInput && file.name !== filenameInput) {
            // window.electronAPI.renameFile(`${currentPath}\\${name}`, `${currentPath}\\${filenameInput}`)
            rename(`${currentPath}\\${file.name}`, `${currentPath}\\${filenameInput}`);
            console.log(`${currentPath}\\${file.name}`, `${currentPath}\\${filenameInput}`);
        }

        setCurrentEditingFile();
    }

    const handleRenameFileSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        if (filenameInput) {
            handleRenameFile();
        }
    }

    const selectIcon = () => {
        switch (file.type) {
            case 'directory':
            case 'disk':
                return Icons.directory;

            case 'file':
            // case 'image':
            default:
                return Icons.file;
        }
    }

    return (
        <button
            data-ctx={file.type}
            data-info={file.name}
            onDoubleClick={onDoubleClick}
            onClick={e => (e.target as HTMLElement).focus()}
            className={'flex cursor-pointer items-center flex-row px-3 py-0.5 rounded-lg bg-[var(--top-grey-dark)]'
                .concat(' gap-x-2 gap-y-1 transition-[background-color] -outline-offset-1 outline-1')
                .concat(' hover:bg-[var(--bottom-grey-dark)]')
                .concat(' active:bg-[var(--bg-dark)]')
                .concat(' focus:outline focus:outline-gray-400')}
        >
            {/* {file.type === 'image' ?
                <img
                    width={50}
                    height={50}
                    src={`${currentPath}/${file.name}`}
                    alt={file.name}
                    className={'max-w-[50px] max-h-[50px]'}
                />
                : */}
            <GoogleIcon
                className={`text-[45px]`.concat(isFile ? '' : ' text-yellow-300')}
                iconName={selectIcon()}
            />
            {/* } */}

            <form onSubmit={handleRenameFileSubmit} className='flex flex-col justify-center items-center gap-y-0.5'>
                {currentEditingFile !== file.name && <p className='leading-none'>{file.name}</p >}
                {currentEditingFile === file.name && (
                    <input
                        required
                        ref={ref => ref?.focus()}
                        value={filenameInput}
                        // onInvalid={e => e.preventDefault()}
                        onFocus={() => setFilenameInput(currentEditingFile)}
                        onBlur={handleRenameFile}
                        onChange={e => setFilenameInput(e.target.value)}
                        className={'block bg-white text-black rounded-lg px-2 outline outline-1 outline-transparent transition-[outline-color,_background-color]'
                            .concat(' invalid:outline-red-400 invalid:bg-red-100')}
                    />
                )}

                {file.type === 'file'/*  || file.type === 'image' */ && (
                    <p className={`text-[var(--secondary-text-dark)] text-[0.8rem] leading-4`}>{xbytes(file.size)}</p>
                )}
            </form>
        </button>
    );
}

export default FileItem;
