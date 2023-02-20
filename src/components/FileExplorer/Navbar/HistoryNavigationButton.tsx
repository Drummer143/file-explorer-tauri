import { useHistoryStore } from '../../../stores/historyStore';
import GoogleIcon from '../../GoogleIcon';

type Props = {
    direction: 'back' | 'forward'

    onClick: React.MouseEventHandler<HTMLButtonElement>;
    setResizable: React.Dispatch<React.SetStateAction<boolean>>
};

function HistoryNavigationButton({ onClick, direction, setResizable }: Props) {
    const { currentPathIndex, history } = useHistoryStore(state => state);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setResizable(false)}
            onMouseLeave={() => setResizable(true)}
            className={'h-[3.25rem] w-[3.25rem] transition-[opacity,_outline-color,_background-color] out rounded-2xl outline outline-transparent outline-1 -outline-offset-1'
                .concat(' grid place-items-center')
                .concat((direction === 'back' && currentPathIndex === 0) ? ' opacity-0 pointer-events-none' : '')
                .concat((direction === 'forward' && currentPathIndex === history.length - 1) ? ' opacity-0 pointer-events-none' : '')
                .concat(' focus:outline-white')
                .concat(' hover:bg-gray-700')
                .concat(' active:bg-gray-500')}
        >
            <GoogleIcon iconName={`arrow_${direction}`} size={40} />
        </button>
    );
}

export default HistoryNavigationButton;
