import React from 'react';
import useSettingsStore from 'src/stores/SettingsStore';
import ItemButton from './ItemButton';

type SectionItemsProps = {
    sectionName: string
    activeItem: string
    items: {
        value: string
        text: string;
        onClick: React.MouseEventHandler<HTMLButtonElement>
    }[]
};

const SectionItems: React.FC<SectionItemsProps> = ({ sectionName, items, activeItem }) => {
    const { activeSection } = useSettingsStore(state => state);

    return (
        <div className={'mt-1 grid gap-1 overflow-hidden transition-[max-height]'
            .concat(' ', activeSection === sectionName ? 'max-h-screen' : 'max-h-0')}
        >
            {items.map(({ text, value, onClick }) => <ItemButton key={value} onClick={onClick} isActive={activeItem === value} text={text} />)}
        </div>
    )
}
export default SectionItems;