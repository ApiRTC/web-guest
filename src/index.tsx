import { createRoot } from 'react-dom/client';
import App from './App';
// import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from "react-router-dom";

import ThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';

import { frFR } from '@apirtc/mui-react-lib';

import './index.css';

const APZ_ORANGE = "#F76B40";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: APZ_ORANGE,
      light: "#ba3108",
      dark: "#f88562"
    },
    secondary: {
      main: "#5b5baf",
      light: "#8eabc7",
      dark: "#2e455c"
    }
  }
}, frFR);

// ReactDOM.render(
// <ThemeProvider theme={theme}>
//   <BrowserRouter basename="/visio-assisted" >
//     <Routes>
//       {/* will try to get invitation data from search parameter */}
//       <Route path="/" element={<App />} />
//       {/* will try to get invitation data from path parameter */}
//       <Route path="/:invitationData" element={<App />} />
//     </Routes>
//   </BrowserRouter>
// </ThemeProvider >,
//   document.getElementById('root')
// );

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ThemeProvider theme={theme}>
    <BrowserRouter basename="/visio-assisted" >
      <Routes>
        {/* will try to get invitation data from search parameter */}
        <Route path="/" element={<App />} />
        {/* will try to get invitation data from path parameter */}
        <Route path="/:invitationData" element={<App />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider >);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
