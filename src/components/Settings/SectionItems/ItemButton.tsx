import React from 'react';

type ItemButtonProps = {
    isActive: boolean
    text: string;

    onClick: React.MouseEventHandler<HTMLButtonElement>
};

const ItemButton: React.FC<ItemButtonProps> = ({ onClick, text, isActive }) => {

    return (
        <button
            disabled={isActive}
            className={'py-0.5 px-2 bg-[var(--bottom-grey-dark)] cursor-pointer rounded transition-[margin,_background-color,_color]'
                .concat(' ', isActive ? 'ml-6 bg-gray-900 text-gray-300' : 'ml-3 mr-3')}
            onClick={onClick}
        >{text}</button>
    )
}
export default ItemButton;