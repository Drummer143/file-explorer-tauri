/* eslint-disable @typescript-eslint/ban-ts-comment */
import { autorun, makeObservable, observable } from "mobx";

export class AppConfig implements IAppConfig {
    filesystem: FilesystemConfig;
    notification: NotificationConfig;

    constructor() {
        //@ts-ignore
        const c: IAppConfig = JSON.parse(JSON.stringify(window.c));

        this.filesystem = c.filesystem;
        this.notification = c.notification;

        //@ts-ignore
        delete window.c;

        makeObservable(this, {
            filesystem: observable,
            notification: observable
        });
    }
}

window.appConfig = new AppConfig();

autorun(() => console.log("autorun", { "appConfig": window.appConfig.filesystem }));
