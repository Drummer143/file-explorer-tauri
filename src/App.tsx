import { useEffect, useState } from "react";

import Settings from "./components/Settings";
import TittleFrame from "./components/TittleFrame";
import FileExplorer from "./components/FileExplorer/FileExplorer";
import FrameWindowControlButtons from "./components/FrameWindowControlButtons/FrameWindowControlButtons";

function App() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <>
            <FrameWindowControlButtons isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
            <TittleFrame isFullScreen={isFullscreen} />
            <Settings />

            <FileExplorer />
        </>
    );
}

export default App;
