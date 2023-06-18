import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";

import Layout from "./components/Layout";
import FileList from "./components/FileList";

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
                element: <FileList />
            },
            route404
        ]
    },
    route404
])
