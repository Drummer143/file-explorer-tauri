import { useEffect, useState } from "react";

import Settings from "./components/Settings/Settings";
import TittleFrame from "./components/TittleFrame/TittleFrame";
import FrameWindowControlButtons from "./components/FrameWindowControlButtons/FrameWindowControlButtons";
import { event } from "@tauri-apps/api";

function App() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        event.listen('changes-in-dir', e => console.log(e.payload));
    })

    return (
        <>
            <FrameWindowControlButtons isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
            <TittleFrame isFullScreen={isFullscreen} />
            <Settings />
        </>
    );
}

export default App;
