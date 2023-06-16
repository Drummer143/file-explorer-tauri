import { test, expect } from 'vitest';

import { render, screen } from 'src/__tests__/test-utils';

import GoogleIcon from 'src/components/GoogleIcon';


test('render with size prop', () => {
    render(<GoogleIcon iconName='html' size={2} />)

    const icon = screen.getByText('html');

    expect(icon).toBeInTheDocument();
})

test('render without size prop', () => {
    render(<GoogleIcon iconName='html' />)

    const icon = screen.getByText('html');

    expect(icon).toBeInTheDocument();
})