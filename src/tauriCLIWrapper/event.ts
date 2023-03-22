import { event as tauriEvent } from "@tauri-apps/api";
import { EventCallback, TauriEvent } from "@tauri-apps/api/event";

export enum EventNames {
    ChangesInDirectory = 'changes-in-dir'
}

export const listen = <T extends keyof Events>(eventName: T, handler: EventCallback<Events[T]>) => {
    return tauriEvent.listen(eventName, handler);
};

export default { listen };