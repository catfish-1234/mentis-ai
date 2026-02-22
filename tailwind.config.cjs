/**
 * Tailwind CSS Configuration — MentisAI
 *
 * Enables class-based dark mode, scans all source file locations for
 * Tailwind utility usage, and extends the default theme with the
 * Inter font family.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
