import React from 'react';
import LocalizedText from '../LocalizedText';
import useSettingsStore from 'src/stores/SettingsStore';

type ToggleSectionButtonProps = {
    sectionName: string
};

const ToggleSectionButton: React.FC<ToggleSectionButtonProps> = ({ sectionName }) => {
    const { activeSection, setActiveSection } = useSettingsStore(state => state);

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
        if (activeSection === sectionName) {
            setActiveSection();
        } else {
            setActiveSection(sectionName);
        }
    }

    return (
        <button
            className={'py-0.5 px-2 rounded transition-[background-color] mt-2 w-full'
                .concat(' outline -outline-offset-2 outline-2 outline-transparent')
                .concat(' ', activeSection === sectionName ? 'bg-gray-800' : 'bg-[var(--top-grey-dark)]')
                .concat(' hover:bg-gray-700')
                .concat(' active:bg-gray-800')}
            onClick={handleClick}
        >
            <LocalizedText i18key={sectionName} />
        </button>
    )
}
export default ToggleSectionButton;