import React, { useState } from 'react';

import {
  useRemeshEvent,
  useRemeshQuery,
  useRemeshDomain,
} from '../remesh/react';

import { remise } from '../remise';

import {
  TodoAppHeaderDomain,
  TodoAppMainDomain,
  TodoAppFooterDomain,
} from './domains/todoApp';

import { TodoFilter } from './domains/todoFilter';

export const TodoHeader = remise(function TodoHeader() {
  const todoAppHeaderDomain = useRemeshDomain(TodoAppHeaderDomain);

  const todoInput = useRemeshQuery(todoAppHeaderDomain.query.TodoInputQuery());

  const isAllCompleted = useRemeshQuery(
    todoAppHeaderDomain.query.IsAllCompletedQuery()
  );

  const handleChange = (value: string) => {
    todoAppHeaderDomain.command.updateTodoInput(value);
  };

  const handleAdd = () => {
    todoAppHeaderDomain.command.addTodo(todoInput);
  };

  const handleToggleAllTodos = () => {
    todoAppHeaderDomain.command.toggleAllTodos();
  };

  useRemeshEvent(todoAppHeaderDomain.event.AddTodoFailedEvent, (event) => {
    alert(event.message);
  });

  return {
    todoInput,
    isAllCompleted,
    handleAdd,
    handleChange,
    handleToggleAllTodos,
  };
});

export const TodoList = remise(function TodoList() {
  const todoListDomain = useRemeshDomain(TodoAppMainDomain);
  const matchedTodoKeyList = useRemeshQuery(
    todoListDomain.query.TodoMatchedKeyListQuery()
  );

  return {
    matchedTodoKeyList,
  };
});

type TodoItemProps = {
  todoId: string;
};

export const TodoItem = remise(function TodoItem(props: TodoItemProps) {
  const todoListDomain = useRemeshDomain(TodoAppMainDomain);

  const todo = useRemeshQuery(todoListDomain.query.TodoItemQuery(props.todoId));

  const [text, setText] = useState('');
  const [edit, setEdit] = useState(false);

  const handleEditing = (value: string) => {
    setText(value);
  };

  const handleSubmit = () => {
    if (text === todo.content) {
      setEdit(false);
    } else {
      todoListDomain.command.updateTodo({
        todoId: todo.id,
        content: text,
      });
      setText('');
      setEdit(false);
    }
  };

  const handleEnableEdit = () => {
    setEdit(true);
    setText(todo.content);
  };

  const handleRemove = () => {
    todoListDomain.command.removeTodo(props.todoId);
  };

  const handleToggle = () => {
    todoListDomain.command.toggleTodo(props.todoId);
  };

  return {
    todo,
    edit,
    text,
    handleToggle,
    handleRemove,
    handleEnableEdit,
    handleSubmit,
    handleEditing,
  };
});

export const TodoFooter = remise(function TodoFooter() {
  const todoAppFooterDomain = useRemeshDomain(TodoAppFooterDomain);

  const itemLeft = useRemeshQuery(
    todoAppFooterDomain.query.TodoItemLeftCountQuery()
  );
  const todoFilter = useRemeshQuery(
    todoAppFooterDomain.query.TodoFilterQuery()
  );

  const handleSwitchTodoFilter = (todoFilter: TodoFilter) => {
    todoAppFooterDomain.command.updateTodoFilter(todoFilter);
  };

  return {
    itemLeft,
    todoFilter,
    handleSwitchTodoFilter,
  };
});

export const TodoApp = () => {
  return (
    <>
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </>
  );
};
