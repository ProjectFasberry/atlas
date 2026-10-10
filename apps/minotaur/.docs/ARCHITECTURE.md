# Architecture

This project follows a model-based architecture, where each component has a
corresponding `.model` file that describes its behavior and responsibilities.

## Main structure

(src as root)
- `/pages` — all application pages and their page-specific logic.

- `/renderer` — everything related to rendering, application layout, and the
  renderer itself.

- `/shared` — reusable code shared across different parts of the application.
  - `/components`
    - `/app` — application-level components, including domain-specific
      components.
    - `/config` — global components and configuration shared across the
      application.
  - `/models` — models shared across different parts of the application.
  - `/lib` — utility functions and other shared application logic.
