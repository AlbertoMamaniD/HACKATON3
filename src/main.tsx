import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AppProvider } from "./app/AppProvider";
import { ClickSpark } from "./components/ClickSpark";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClickSpark sparkColor="#18b981" sparkSize={9} sparkRadius={18} duration={420}>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </ClickSpark>
  </StrictMode>,
);
