import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";

import Layout from "./components/Layout";
import FilesView from "./components/FilesView";

const route404: RouteObject = {
    path: "/",
    element: <Navigate to="/explorer/" replace />
}

export default createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/explorer",
                element: <FilesView />
            },
            {
                path: "/explorer/:path",
                element: <FilesView />
            },
            route404
        ]
    },
    route404
])
