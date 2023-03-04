/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            boxShadow: {
                'ctx': '0 0 1rem 0 #333'
            },
        },
    },
    plugins: [],
}
