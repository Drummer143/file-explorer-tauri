import FilesView from "./components/FilesView";
import WindowFrame from "./components/WindowFrame";

import styles from "./App.module.scss";

const App: React.FC = () => {
    return (
        <div className={styles.app}>
            <WindowFrame />

            <div>
                <FilesView />
            </div>
        </div>
    );
}

export default App;
