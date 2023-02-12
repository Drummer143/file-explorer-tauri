import LocalizedText from './LocalizedText';

type Props = {
    isFullScreen: boolean;
};

function TittleFrame({ isFullScreen }: Props) {
    return (
        <div
            data-tauri-drag-region
            className={'absolute transition-[top] left-1/2 -translate-x-1/2 text-xl grid'
                .concat(' bg-[var(--menu-dark)] w-48 h-11 rounded-b-lg place-items-center')
                .concat(' ', isFullScreen ? '-top-11' : 'top-0')
            }
        >
            <LocalizedText i18key='title' />
        </div>
    );
}

export default TittleFrame;
