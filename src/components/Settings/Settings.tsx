import { useEffect, useRef } from 'react';

import LocalizedText from '../LocalizedText';
import LanguageSettings from './LanguageSettings';
import useSettingsStore from 'src/stores/SettingsStore';
import ToggleSettingsButton from './ToggleSettingsButton';

function Settings() {
    const { setActiveSection, isOpened, toggleOpened } = useSettingsStore(state => state);

    const settingsRef = useRef<HTMLDivElement>();

    const toggleSettings = () => {
        if (isOpened) {
            setActiveSection('');
        }

        toggleOpened(prev => !prev)
    };

    const handleOuterSettingsClick = (e: MouseEvent) => {
        if (settingsRef.current && !e.composedPath().includes(settingsRef.current)) {
            toggleSettings();
            document.removeEventListener('click', handleOuterSettingsClick);
        }
    }

    const handleEscapeKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
            toggleSettings();
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKeyDown);

        return () => {
            document.removeEventListener('keydown', handleEscapeKeyDown);
        }
    }, [])

    useEffect(() => {
        if (isOpened) {
            document.addEventListener('click', handleOuterSettingsClick);

            return () => {
                document.removeEventListener('click', handleOuterSettingsClick);
            }
        }
    }, [isOpened])

    return (
        <div ref={settingsRef} className={'absolute z-[10] bottom-0 right-0 transition-transform'
            .concat(isOpened ? '' : ' translate-x-full')}
        >
            <ToggleSettingsButton />

            <div className='bg-[var(--menu-dark)] p-2 rounded-tl-md'>
                <div className='text-center'>
                    <h3><LocalizedText i18key='settings' /></h3>

                    <LanguageSettings />
                </div>
            </div>
        </div>
    )
}

export default Settings;