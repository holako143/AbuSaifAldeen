# Shiffration | شفريشن

This is a web application for encoding and decoding text using various algorithms, including a custom Emoji-based cipher and Base64. It was built iteratively based on user feedback to be a feature-rich and secure tool for text manipulation.

## Features

-   **Multiple Encoding Algorithms:** Supports a custom secure EmojiCipher (using AES-GCM) and standard Base64.
-   **Password Protection:** The EmojiCipher can be protected with a user-provided password for strong encryption.
-   **Customizable Symbol Sets:** Users can create, manage, and use their own lists of emojis or characters for the EmojiCipher.
-   **History:** Automatically saves encoding/decoding history to local storage for later use.
-   **Theming:** Supports multiple themes, including a default "Orange" theme and a dark mode.
-   **File Support:** Allows users to upload text from a file and download the output.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **State Management:** React Context
-   **Encryption:** Web Crypto API (AES-GCM)

## Getting Started

To run this project locally, you will need Node.js and npm installed.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To create an optimized production build, run:
```bash
npm run build
```
This will generate a static export of the application in the `.next` folder, which can then be deployed to a hosting service like Vercel.
