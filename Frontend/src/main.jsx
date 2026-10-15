import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./App/Store";
import { LanguageProvider } from "./Context/LanguageContext";
import "./app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);