import { v4 } from "uuid";

import FileListItemButton from "@components/customs/FileListItemButton";
import { customRender } from "@test-utils";

describe("FileListItemButton test", () => {
    // eslint-disable-next-line react/react-in-jsx-scope
    const id = v4();

    const props = {
        "data-testid": id,
        onAction: vi.fn(() => console.info("action"))
    };

    test("component renders correctly", () => {
        const component = customRender(<FileListItemButton {...props}>Test button</FileListItemButton>);

        const button = component.getByTestId(id, { exact: true });

        button.focus();

        expect(button).toBeInTheDocument();
        expect(button).toHaveFocus();
    });
});
