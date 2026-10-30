import React from "react"

import ReactDOM from "react-dom/client"

import App from "./App"

import FieldSale from "./FieldSale"

import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {new URLSearchParams(location.search).has("buy") ? <FieldSale /> : <App />}
  </React.StrictMode>,
)
