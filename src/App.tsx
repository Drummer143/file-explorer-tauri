import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import router from "./router";

const App: React.FC = () => {
    // TODO: remove after history navigation components will be made
    const handleKeyDown = (e: KeyboardEvent) => {
        switch(e.key) {
            case "ArrowLeft":
                history.back();
                break;
            case "ArrowRight":
                history.forward();
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
