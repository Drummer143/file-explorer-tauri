import { test, expect } from 'vitest';

import { render, screen } from 'src/__tests__/test-utils';

import ItemButton from 'src/components/Settings/SectionItems/ItemButton';

test('renders disabled button', () => {
    render(<ItemButton isActive={true} onClick={() => console.log('clicked')} text='test' />)

    const button = screen.getByText('test');

    expect(button).toBeDisabled();
})

test('renders not disabled button', () => {
    render(<ItemButton isActive={false} onClick={() => console.log('clicked')} text='test' />)

    const button = screen.getByText('test');

    expect(button).not.toBeDisabled();
})