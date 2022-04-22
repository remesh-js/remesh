import * as ReactDOMClient from 'react-dom/client'

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)

  root.render(
    <>
      <h2>React + Remesh</h2>
      <ul>
        <li>
          <a href={`${import.meta.env.BASE_URL}react/7guis/index.html`}>7guis app</a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}react/todo-mvc/index.html`}>todo-mvc app</a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}react/todo-mvc-with-multiple-domains/index.html`}>
            todo-mvc-with-multiple-domains app
          </a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}react/chess/index.html`}>chinese chess</a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}react/others/index.html`}>others...</a>
        </li>
      </ul>
      <h2>Vue + Remesh</h2>
      <ul>
        <li>
          <a href={`${import.meta.env.BASE_URL}vue/7guis/index.html`}>7guis app</a>
        </li>
        {/* <li>
          <a href={`${import.meta.env.BASE_URL}vue/todo-mvc/index.html`}>todo-mvc app</a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}vue/todo-mvc-with-multiple-domains/index.html`}>
            todo-mvc-with-multiple-domains app
          </a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}vue/chess/index.html`}>chinese chess</a>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}vue/others/index.html`}>others...</a>
        </li> */}
      </ul>
    </>,
  )
}
