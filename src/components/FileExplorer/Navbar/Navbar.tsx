import React, { useState } from 'react';

import PathInput from './PathInput/PathInput';
import useHistoryStore from 'src/stores/historyStore';
import HistoryNavigationButton from './HistoryNavigationButton';

const Navbar: React.FC = () => {
    const { goForward, goBack } = useHistoryStore(state => state);

    const [resizable, setResizable] = useState(true);

    const handleGoBack = (e: React.MouseEvent<HTMLButtonElement>) => {
        goBack();

        if (e.clientX || e.clientY) {
            setResizable(false);
        }
    }

    const handleGoForward = (e: React.MouseEvent<HTMLButtonElement>) => {
        goForward();

        if (e.clientX || e.clientY) {
            setResizable(false);
        }
    }

    return (
        <div
            className={'absolute top-16 left-1/2 -translate-x-1/2 min-w-[400px] max-w-[80%] transition-[opacity,_width] text-4xl'
                .concat(' flex justify-center items-center gap-5 flex-row')}
        >
            <HistoryNavigationButton setResizable={setResizable} direction='back' onClick={handleGoBack} />

            <PathInput resizable={resizable} setResizable={setResizable} />

            <HistoryNavigationButton setResizable={setResizable} direction='forward' onClick={handleGoForward} />
        </div>
    )
}
export default Navbar;