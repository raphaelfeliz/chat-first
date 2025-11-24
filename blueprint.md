# Project Blueprint

## Overview

A simple chat application with a product display. The user can send and receive messages in real-time. The application is built with HTML, Tailwind CSS, and vanilla JavaScript, and uses Firebase for its backend.

## Project Structure

- `index.html`: The main HTML file containing the application's structure, styles, and scripts.
- `.idx/mcp.json`: Configuration file for the Firebase development environment.
- `src/`: Contains the source code for the application logic (chat, configurator, state management, etc.).

## Features

- **Split-screen layout (Desktop):**
    - Left side: Displays a list of products with images and prices.
    - Right side: A real-time chat interface.
- **Tabbed Layout (Mobile):**
    - Navigation bar at the top to switch between "Filtro Rápido" (Configurator) and "Chat".
    - Only one section is visible at a time on smaller screens.
- **Real-time chat:**
    - Users can send messages.
    - Messages are stored in Firestore.
    - New messages are displayed in real-time.
- **Product Configurator:**
    - Interactive question-based product filtering.
- **Styling:**
    - Tailwind CSS for a modern, responsive design.

## History

1.  **Get Firebase Configuration:** Fetched the Firebase configuration for the web app.
2.  **Update `index.html`:** Added the Firebase configuration to the `index.html` file.
3.  **Configure Development Environment:** Updated the `.idx/mcp.json` file to enable the Firebase development environment.
4.  **Create Blueprint:** Created this `blueprint.md` file to document the project and the steps taken.
5.  **Mobile Navigation Enhancements:** Enhanced the mobile navigation bar with:
    *   Background color matching the bottom input area.
    *   An image logo (`assets/images/favicon-fabricadoaluminio.png`) on the left.
    *   White font for both active and inactive tabs.
    *   A bold font and a blue underline on the active tab, with corrected hover states.
6.  **Card Layout Adjustment:** Modified the card styles to display two cards per row on most devices, with slightly smaller content for a more compact look.
7.  **Logo Size Refinement:** Further reduced the logo size and margin in the mobile navigation bar to maximize space for the navigation text.
