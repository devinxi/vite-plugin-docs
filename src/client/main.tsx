// register vue composition api globally
// import { createApp } from 'vue'
// import { createRouter, createWebHistory } from 'vue-router'
// import routes from 'virtual:generated-pages'
// import App from './App.vue'

// windicss layers
import "virtual:windi-base.css";
import "virtual:windi-components.css";
import "./styles/main.css";
import "./styles/cm.css";
import "virtual:windi-utilities.css";
import "virtual:windi-devtools";

import { render } from "solid-js/web";
import { Router } from "solid-app-router";

console.log("hello");
import App from "./App";

render(
  () => (
    <Router base="/__docs">
      <App />
    </Router>
  ),
  document.getElementById("app")!
);
