import React from 'react';
import GoogleIcon from '../GoogleIcon';
import useSettingsStore from 'src/stores/SettingsStore';

const ToggleSettingsButton: React.FC = () => {
    const { isOpened, toggleOpened } = useSettingsStore(state => state);

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => toggleOpened(prev => !prev);

    return (
        <button
            className={'absolute z-[1] bg-[var(--bg-dark)] top-0 left-0 -translate-x-full transition-transform rounded-2xl outline outline-1 w-10 h-10'
                .concat(' transition-[opacity,_outline-color,_background-color] outline-transparent -outline-offset-1 scale-[80%] -translate-y-[10%]')
                .concat(' focus:outline-white')
                .concat(' hover:bg-gray-700')
                .concat(' active:bg-gray-500')}
                onClick={handleClick}
        >
            <GoogleIcon
                className={isOpened ? 'rotate-180' : ''}
                iconName='arrow_left'
                size={40}
            />
        </button>
    )
}
export default ToggleSettingsButton;