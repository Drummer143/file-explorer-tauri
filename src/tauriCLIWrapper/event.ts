import { event as tauriEvent } from "@tauri-apps/api";
import { EventCallback, TauriEvent } from "@tauri-apps/api/event";

type AccessType = {
    access: { kind: string | { [key: string]: string } }
}

type AnyType = {
    [key: string]: any
}

type CreateType = {
    create: {
        kind: 'any' | 'file' | 'folder' | 'other'
    }
};

type ModifyType = {
    modify: { from: string, to: string } | { [key: string]: any }
}

type OtherType = AnyType

type RemoveType = {
    remove: {
        kind: 'any' | 'file' | 'folder' | 'other'
    }
}

type EventTypes = {
    access: AccessType
    any: AnyType
    create: CreateType
    modify: ModifyType
    remove: RemoveType
    other: OtherType
};

interface NotifyEvent<T extends keyof EventTypes> {
    attrs: {
        [key: string]: any
    }
    paths: string[]
    type: EventTypes[T]
}

type ChangesInDirectoryPayload = ({ kind: 'Access' } & NotifyEvent<'access'>) |
    ({ kind: 'any' } & NotifyEvent<'any'>) |
    ({ kind: 'create' } & NotifyEvent<'create'>) |
    ({ kind: 'modify' } & NotifyEvent<'modify'>) |
    ({ kind: 'other' } & NotifyEvent<'other'>) |
    ({ kind: 'remove' } & NotifyEvent<'remove'>);

type Events = {
    'changes-in-dir': ChangesInDirectoryPayload
};

export const listen = <T extends keyof Events>(eventName: T, handler: EventCallback<Events[T]>) => {
    return tauriEvent.listen(eventName, handler);
};

export default { listen };