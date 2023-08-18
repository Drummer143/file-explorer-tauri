import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";

import FileCopyingTracker from "@components/ClipboardActionTrackerList/FileCopyingTracker";
import { customRender, fireEvent, screen, waitFor } from "@test-utils";

describe("FileCopyingTracker test", () => {
    mockWindows("main");
    mockIPC(cmd => cmd);

    test("components renders correctly", () => {
        const eventId = Math.floor(Math.random() * 10);

        const component = customRender(
            <FileCopyingTracker
                action="copy"
                eventId={eventId}
                filename="filename"
                from={__dirname}
                to={__dirname}
                onRemove={vi.fn()}
                type="file"
            />
        );

        const tracker = component.getByTestId(eventId);

        expect(tracker).toBeInTheDocument();
    });

    test("spyOnRemove has to be called on copy cancel", async () => {
        const eventId = Math.floor(Math.random() * 10);

        const spyOnRemove = vi.fn();

        const component = customRender(
            <FileCopyingTracker
                action="copy"
                eventId={eventId}
                filename="filename"
                from={__dirname}
                to={__dirname}
                onRemove={spyOnRemove}
                type="file"
            />
        );

        fireEvent.mouseEnter(component.baseElement);

        const cancelCopyButton = component.getByTitle("Cancel copy");

        fireEvent.click(cancelCopyButton);

        waitFor(
            () => {
                const removeTrackerButton = screen.getByTitle("Save copied part");

                removeTrackerButton.click();

                expect(spyOnRemove).toBeCalled();
            },
            {
                timeout: 1000
            }
        );
    });
});
