import { useState } from "react";

import Settings from "./components/Settings/Settings";
import TittleFrame from "./components/TittleFrame";
import ContextMenu from "./components/ContextMenu/ContextMenu";
import FileExplorer from "./components/FileExplorer/FileExplorer";
import FrameWindowControlButtons from "./components/FrameWindowControlButtons/FrameWindowControlButtons";

const App: React.FC = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <>
            <ContextMenu />
            <FrameWindowControlButtons isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
            <TittleFrame isFullScreen={isFullscreen} />
            <Settings />

            <FileExplorer />
        </>
    );
}

export default App;
