import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import router from "./router";
import { useExplorerHistory } from "./zustand";

const App: React.FC = () => {
    const { goBack, goForward, clear } = useExplorerHistory();
    // TODO: remove after history navigation components will be made
    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowLeft":
                goBack();
                break;
            case "ArrowRight":
                goForward();
                break;
            case "C": {
                if(e.shiftKey) {
                    clear();
                }
            }
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        }
    });

    return (
        <RouterProvider router={router} />
    );
}

export default App;
