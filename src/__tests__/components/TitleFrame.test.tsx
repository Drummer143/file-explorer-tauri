import { test, expect } from 'vitest';

import { render, screen } from 'src/__tests__/test-utils';

import TittleFrame from 'src/components/TittleFrame';

test('Renders title frame in fullscreen window', () => {
    render(<TittleFrame isFullScreen={true} />);

    const frame = screen.getByText(/File Explorer/);

    expect(frame).toBeInTheDocument();
})

test('Renders title frame in window', () => {
    render(<TittleFrame isFullScreen={false} />);

    const frame = screen.getByText(/File Explorer/);

    expect(frame).toBeInTheDocument();
})