import { render, screen } from './test-utils';
import { test, expect } from 'vitest';

import TittleFrame from 'src/components/TittleFrame';

test('Renders title frame', () => {
    render(<TittleFrame isFullScreen={true} />);

    const frame = screen.getByText(/File Explorer/);

    expect(frame).toBeInTheDocument();
})