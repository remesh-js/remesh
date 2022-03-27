import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <React.StrictMode>
    <ul>
      <li>
        <a href={`${import.meta.env.BASE_URL}7guis/index.html`}>7guis app</a>
      </li>

      <li>
        <a href={`${import.meta.env.BASE_URL}todo-mvc/index.html`}>todo-mvc app</a>
      </li>
    </ul>
  </React.StrictMode>,
  document.getElementById('root')
);
