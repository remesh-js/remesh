import React from 'react'
import * as ReactDOMClient from 'react-dom/client'

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)

  root.render(
    <ul>
      <li>
        <a href={`${import.meta.env.BASE_URL}7guis/index.html`}>7guis app</a>
      </li>

      <li>
        <a href={`${import.meta.env.BASE_URL}todo-mvc/index.html`}>todo-mvc app</a>
      </li>
      <li>
        <a href={`${import.meta.env.BASE_URL}todo-mvc-with-multiple-domains/index.html`}>
          todo-mvc-with-multiple-domains app
        </a>
      </li>
      <li>
        <a href={`${import.meta.env.BASE_URL}chess/index.html`}>chinese chess</a>
      </li>
    </ul>,
  )
}
