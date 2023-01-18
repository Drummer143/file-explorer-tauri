import { useState } from "react";
import FrameWindowControlButtons from "./components/FrameWindowControlButtons/FrameWindowControlButtons";
import TittleFrame from "./components/TittleFrame/TittleFrame";

function App() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <>
            <FrameWindowControlButtons isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
            <TittleFrame isFullScreen={isFullscreen} />
        </>
    );
}

export default App;
