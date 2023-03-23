import { test, expect, it } from 'vitest';
import { render, screen } from './test-utils';

import LocalizedText from 'src/components/LocalizedText';

it('testing internalization', () => {
    test('Russian', () => {
        render(<LocalizedText i18key='create' options={{ lng: 'ru' }} />)

        const element = screen.findByText('Создать');

        expect(element).toBeInTheDocument();
    })

    test('English', () => {
        render(<LocalizedText i18key='create' options={{ lng: 'ru' }} />)

        const element = screen.findByText('Create');

        expect(element).toBeInTheDocument();
    })
})