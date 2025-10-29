import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import theme from './Theme.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <ThemeProvider theme={theme}>
    <BrowserRouter>
      <CssBaseline /> {/* resets default browser styles */}
      <App />
     </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
