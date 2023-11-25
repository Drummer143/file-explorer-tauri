import { proxy } from "valtio";
import { devtools } from "valtio/utils";

window.appConfig = proxy(window.appConfig);

devtools(appConfig, { name: "appConfig" });
