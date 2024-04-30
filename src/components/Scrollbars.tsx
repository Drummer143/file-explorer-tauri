import React from "react";
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentProps } from "overlayscrollbars-react";

const Scrollbars: React.FC<OverlayScrollbarsComponentProps<"div">> = props => (
    <OverlayScrollbarsComponent
        element="div"
        defer
        {...props}
        options={{
            overflow: {
                x: "hidden"
            },
            scrollbars: {
                autoHide: "leave",
                autoHideDelay: 150
            },
            ...(props || {}).options
        }}
    />
);

export default Scrollbars;
