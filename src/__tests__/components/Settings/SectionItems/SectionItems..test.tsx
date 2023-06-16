import { test, expect, it } from 'vitest';

import { render, screen } from 'src/__tests__/test-utils';

import SectionItems from 'src/components/Settings/SectionItems/SectionItems';

type Item = {
    value: string;
    text: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

it('render section items list', () => {
    test('not empty list', () => {
        const items: Item[] = [
            {
                text: 'button1',
                value: 'button1',
                onClick: () => console.log('button1')
            },
            {
                text: 'button2',
                value: 'button2',
                onClick: () => console.log('button2')
            },
            {
                text: 'button3',
                value: 'button3',
                onClick: () => console.log('button3')
            },
        ]

        render(<SectionItems activeItem='item1' items={items} sectionName='test' />)

        const buttonItems = screen.getAllByText(/button/)

        expect(buttonItems).length(3);
    })

    test('empty list', () => {
        render(<SectionItems activeItem='item1' items={[]} sectionName='test' />)

        const buttonItems = screen.getAllByText(/button/)

        expect(buttonItems).length(0);
    })
})