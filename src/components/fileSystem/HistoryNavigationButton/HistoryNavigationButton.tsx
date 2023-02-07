import { useHistoryStore } from '../../../stores/historyStore';
import GoogleIcon from '../../GoogleIcon/GoogleIcon';

type Props = {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    direction: 'back' | 'forward'
};

function HistoryNavigationButton({ onClick, direction }: Props) {
    const { currentPathIndex, history } = useHistoryStore(state => state);

    return (
        <button
            onClick={onClick}
            className={'h-[3.25rem] w-[3.25rem] transition-[opacity,_outline-color,_background-color] out rounded-2xl outline outline-transparent outline-1 -outline-offset-1'
                .concat(' grid place-items-center')
                .concat((direction === 'back' && currentPathIndex === 0) ? ' opacity-0 pointer-events-none' : '')
                .concat((direction === 'forward' && currentPathIndex === history.length - 1) ? ' opacity-0 pointer-events-none' : '')
                .concat(' focus:outline-white')
                .concat(' hover:bg-gray-700')
                .concat(' active:bg-gray-500')}
        >
            <GoogleIcon iconName={direction === 'back' ? 'arrow_back' : 'arrow_forward'} size={40} />
        </button>
    );
}

export default HistoryNavigationButton;
