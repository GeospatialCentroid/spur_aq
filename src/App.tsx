import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Info from './App/Info/Info';
import Stack from './App/Stack/Stack';

function App() {
  return (
    <div className="App"> {/* Entire App to Render */}
      <header className="App-header"> {/* Header of the site */}
        <h1>SPUR Air Quality</h1>
      </header>
      <main className='App-body'> {/* Container for the meat and potatos */}
        <section className="Body-section"> {/* Info */}
          <Info />
        </section>
        <section className="Body-section"> {/* Graph Stack */}
          <Stack />
        </section>
      </main>
      <footer className="App-footer"> {/* Footer */}
        <p>© {new Date().getFullYear()} SPUR. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
