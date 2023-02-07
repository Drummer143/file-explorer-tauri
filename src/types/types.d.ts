interface FileTypesMap {
    disk: 'disk',
    directory: 'directory',
    file: 'file',
    // image: 'image'
};

type CFile = {
    name: string,
    type: (keyof FileTypesMap)
    size: number
}

type FileCreatingModalParams = {
    type: 'file' | 'folder'
    path: string
}

type PopupInfo = {
    type: ErrorType
    message: string
    id: string
}

type ElectronErrorType = 'error' | 'warning' | 'info';

type ElectronErrorKind = 'invalidPath' | 'onOpenFile' | 'onGetInfo'

type ElectronErrorAdditionalData = Partial<{
    path: string
}>

type ActionFieldProps = {
    name: string;
    onClick: (info?: string) => void;
    type: 'action'
}

type SubsectionFieldProps = {
    type: 'section'
    name: string,
    children: ActionFieldProps[]
}

type MenuSections = {
    [key: string]: (SubsectionFieldProps | ActionFieldProps)[];
};