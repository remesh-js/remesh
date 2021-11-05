import React from 'react';
import ReactDOM from 'react-dom';

import { RemiseProvider } from '../remise';
import { RemeshRoot } from '../remesh/react';

import { TodoListExtern } from './domains/todoList';
import { Todo } from './domains/todoApp';

import { TodoApp } from './View.headless';

import {
  TodoHeaderImpl,
  TodoFooterImpl,
  TodoListImpl,
  TodoItemImpl,
} from './View.impl';

const implList = [TodoHeaderImpl, TodoFooterImpl, TodoListImpl, TodoItemImpl];

export const TodoAppRoot = () => {
  return (
    <RemiseProvider list={implList}>
      <TodoApp />
    </RemiseProvider>
  );
};

const initialTodoList: Todo[] = [
  {
    id: '-1',
    content: 'learn remesh',
    completed: true,
  },
];

ReactDOM.render(
  <React.StrictMode>
    <RemeshRoot
      options={{
        name: 'TodoAppStore',
        externs: [TodoListExtern(initialTodoList)],
      }}
    >
      <TodoAppRoot />
    </RemeshRoot>
  </React.StrictMode>,
  document.getElementById('root')
);

window.ReactDOM = ReactDOM;
