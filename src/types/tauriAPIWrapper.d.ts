type AccessType = {
    access: { kind: string | { [key: string]: string } };
};

type AnyType = {
    [key: string]: unknown;
};

type CreateType = {
    create: {
        kind: "any" | "file" | "folder" | "other";
    };
};

type ModifyType = {
    modify: { kind: "rename" | "any"; mode?: "from" | "to" };
};

type OtherType = AnyType;

type RemoveType = {
    remove: {
        kind: "any" | "file" | "folder" | "other";
    };
};

type EventTypes = {
    access: AccessType;
    any: AnyType;
    create: CreateType;
    modify: ModifyType;
    remove: RemoveType;
    other: OtherType;
};

interface NotifyEvent<T extends keyof EventTypes> {
    fileInfo: CFile;
    attrs: {
        [key: string]: unknown;
    };
    name: string;
    paths: string[];
    kind: EventTypes[T];
}

type ChangesInDirectoryPayload =
    | ({ type: "access" } & NotifyEvent<"access">)
    | ({ type: "any" } & NotifyEvent<"any">)
    | ({ type: "create" } & NotifyEvent<"create">)
    | ({ type: "modify" } & NotifyEvent<"modify">)
    | ({ type: "other" } & NotifyEvent<"other">)
    | ({ type: "remove" } & NotifyEvent<"remove">);

type Events = {
    "changes-in-dir": ChangesInDirectoryPayload;
};

interface FileCopyOptions {
    skipExist: boolean;
    overwrite: boolean;
    removeTargetOnFinish?: boolean;
}

interface DirectoryCopyOptions {
    skipExist: boolean;
    ifExists: "cancel" | "overwrite" | "merge";
    ifNestedFileExist: "overwrite" | "saveBoth" | "ask" | "skip"
    removeTargetOnFinish?: boolean;
}
