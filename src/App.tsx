import { useState } from "react";

import Settings from "./components/Settings/Settings";
import TittleFrame from "./components/TittleFrame/TittleFrame";
import FrameWindowControlButtons from "./components/FrameWindowControlButtons/FrameWindowControlButtons";

function App() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <>
            <FrameWindowControlButtons isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
            <TittleFrame isFullScreen={isFullscreen} />
            <Settings />
        </>
    );
}

export default App;
