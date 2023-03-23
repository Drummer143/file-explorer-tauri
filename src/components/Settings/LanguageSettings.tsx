import React, { useState } from 'react';

import i18n from 'src/i18n';
import SectionItems from './SectionItems/SectionItems';
import ToggleSectionButton from './ToggleSectionButton';

const LanguageSettings: React.FC = () => {
    const [languages] = useState(i18n.languages.concat().sort());
    const [languageNames, setLanguageNames] = useState<Intl.DisplayNames>(new Intl.DisplayNames(i18n.language, { type: 'language' }));

    const handleLanguageChange = (language: string) => {
        i18n.changeLanguage(language).then(
            () => {
                setLanguageNames(new Intl.DisplayNames(i18n.language, { type: 'language' }))
            },
            (error) => console.error(error)
        );
    }

    return (
        <>
            <ToggleSectionButton sectionName='language' />

            <SectionItems
                activeItem={i18n.language}
                sectionName='language'
                items={languages.map(language => ({
                    onClick: () => handleLanguageChange(language),
                    value: language,
                    text: languageNames.of(language)
                }))}
            />
        </>
    )
}
export default LanguageSettings;