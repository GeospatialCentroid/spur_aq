# `SPUR AQ`
The codebase for the frontend of the Colorado State University SPUR Campus' Air Quality Data Visualization Site

---
## `Basic Commands`
#### `npm install`
Installs packages necessary for the project
#### `npm start`
Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
#### `npm test`
Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.
#### `npm run build`
Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

---
## `File Structure`

```
root
├── public/
│   ├── config.json
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App/
│   │   ├── App.css
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── Info/
│   │   │   ├── Info.css
│   │   │   └── Info.tsx
│   │   └── Stack/
│   │       ├── Stack.css
│   │       ├── Stack.tsx
│   │       └── Graph/
│   │           ├── Graph.css
│   │           ├── Graph.tsx
│   │           └── Components/
│   │               ├── Chart/
│   │               │   ├── Chart.css
│   │               │   ├── Chart.tsx
│   │               │   ├── D3Chart.tsx
│   │               │   ├── DomainSlider.css
│   │               │   └── DomainSlider.tsx
│   │               ├── ControlBar/
│   │               │   ├── CloseButton.css
│   │               │   ├── CloseButton.tsx
│   │               │   ├── ControlBar.css
│   │               │   ├── ControlBar.tsx
│   │               │   ├── DragHandle.css
│   │               │   └── DragHandle.tsx
│   │               └── Menu/
│   │                   ├── Menu.css
│   │                   ├── Menu.tsx
│   │                   ├── DateSelector.css
│   │                   ├── DateSelector.tsx
│   │                   ├── IntervalSelector.tsx
│   │                   ├── ExpandToggle.css
│   │                   ├── ExpandToggle.tsx
│   │                   ├── VariableSelector.css
│   │                   ├── VariableSelector.tsx
│   │                   └── VariableModal/
│   │                       ├── VariableModal.css
│   │                       ├── VariableModal.tsx
│   │                       ├── VariableDescription.css
│   │                       ├── VariableDescription.tsx
│   │                       ├── VariableList.tsx
│   │                       └── VariableList.css
│   ├── context/
│   │   └── ConfigContext.tsx
│   ├── types/
│   │   ├── config.ts
│   │   ├── instrument.tsx
│   │   ├── measurement.ts
│   │   └── jquery-datetimepicker.d.ts
│   ├── index.css
│   ├── index.tsx
├── .env
├── .gitignore
├── desktop.ini
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── react-app-env.d.ts
├── reportWebVitals.ts
└── setupTests.ts
```

---
# React + D3 Commenting Style Guide

This guide outlines the preferred commenting style for components using **React + D3**, focused on clarity, structure, and maintainability.

## 1. Top-Level Component Comment Block

Use a `/** ... */` block at the top of each component or file to explain:

- What the component does
- Key behaviors or features
- External libraries or dependencies used (e.g. D3.js)

```ts
/**
 * D3Chart component
 *
 * - Uses D3.js to render a time series chart inside an SVG element.
 * - Dynamically creates x and y axes based on props.
 * - Designed to be reused across Graphs with different configurations.
 */
```


## 2. Props Interface Documentation

Use `@property` tags inside a `/** ... */` block to annotate each prop in a component’s props interface:

```ts
interface D3ChartProps {
  /**
   * @property id - Unique identifier for the chart (used in label/title).
   */
  id: number;

  /**
   * @property fromDate - Start time (ISO string) for the X-axis.
   */
  fromDate: string;

  /**
   * @property interval - Time step in minutes used for tick spacing.
   */
  interval: string;
}
```


## 3. Section-Level Comments

Use section comments (`//` or `/** ... */`) to explain groups of logic, especially when:

- Calculating layout dimensions
- Creating D3 scales or axes
- Managing lifecycle logic in `useEffect`

```ts
// Calculate dimensions based on container and margins
const innerWidth = width - margin.left - margin.right;
```


## 4. Inline Comments

For critical logic or expressions that may be non-obvious, use `//` comments inline or above the line:

```ts
.attr('dy', '1.2em') // Push the second line of the tick label down
```


## Summary

| Element            | Style                                       |
|--------------------|---------------------------------------------|
| Top-level comment  | `/** */` with high-level purpose and notes |
| Prop doc           | `@property` inside `interface` block       |
| Section comment    | `//` or `/** */` above major logic blocks  |
| Inline comment     | `//` for complex or significant lines      |

This structure supports both **readability** and **scalability** in collaborative, data-driven React applications.

