import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/tokens/fonts.css';
import './styles/tokens/colors.css';
import './styles/tokens/typography.css';
import './styles/tokens/spacing.css';
import './styles/tokens/elevation.css';
import './styles/tokens/base.css';
import './styles/components.css';
import './styles/portal.css';
import './styles/mobile.css';
import App from './App';
import { DemoProvider } from './store/DemoStore';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoProvider>
        <App />
      </DemoProvider>
    </BrowserRouter>
  </StrictMode>,
);
