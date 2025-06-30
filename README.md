# `SPUR AQ`
The codebase for the frontend of the Colorado State University SPUR Campus' Air Quality Data Visualization Site
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
