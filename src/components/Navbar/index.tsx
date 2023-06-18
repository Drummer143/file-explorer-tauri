import React from 'react';

import PathInput from './PathInput';
import NavigationButtons from './NavigationButtons';

import styles from "./Navbar.module.scss";

const Navbar: React.FC = () => {
    return (
        <div className={styles.wrapper}>
            <NavigationButtons />

            <PathInput />
        </div>
    )
}

export default Navbar;
