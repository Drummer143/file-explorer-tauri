import React from 'react';

import NavigationButtons from './NavigationButtons';

import styles from "./Navbar.module.scss";

const Navbar: React.FC = () => {
    return (
        <div className={styles.wrapper}>
            <NavigationButtons />
        </div>
    )
}

export default Navbar;
