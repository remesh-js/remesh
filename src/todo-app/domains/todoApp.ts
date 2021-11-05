import { map } from 'rxjs/operators';
import { Remesh } from '../../remesh';

import { TodoInputDomain } from './todoInput';
import { TodoFilterDomain } from './todoFilter';
import { TodoListDomain } from './todoList';
import { merge, of } from 'rxjs';

import type { Todo } from './todoList';

export type { Todo };

const TodoAppHeaderWidget = Remesh.widget((domain) => {
  const todoInputDomain = domain.get(TodoInputDomain);
  const todoListDomain = domain.get(TodoListDomain);

  const TodoHeaderTask = domain.task({
    name: 'TodoHeaderTask',
    impl: ({ fromEvent }) => {
      const clearTodoInput$ = fromEvent(
        todoListDomain.event.AddTodoSuccessEvent
      ).pipe(map(() => todoInputDomain.event.TodoInputEvent('')));

      return merge(clearTodoInput$);
    },
  });

  return {
    autorun: [TodoHeaderTask],
    query: {
      IsAllCompletedQuery: todoListDomain.query.IsAllCompletedQuery,
      ...todoInputDomain.query,
    },
    event: {
      AddTodoEvent: todoListDomain.event.AddTodoEvent,
      ToggleAllTodosEvent: todoListDomain.event.ToggleAllTodosEvent,
      AddTodoFailedEvent: todoListDomain.event.AddTodoFailedEvent,
      ...todoInputDomain.event,
    },
  };
});

const TodoAppMainWidget = Remesh.widget((domain) => {
  const todoInputDomain = domain.get(TodoInputDomain);
  const todoFilterDomain = domain.get(TodoFilterDomain);
  const todoListDomain = domain.get(TodoListDomain);

  const TodoFilteredListQuery = domain.query({
    name: 'TodoFilteredListQuery',
    impl: ({ get }) => {
      const todoList = get(todoListDomain.query.TodoListQuery());
      const todoSortedList = get(todoListDomain.query.TodoSortedListQuery());
      const todoFilter = get(todoFilterDomain.query.TodoFilterQuery());

      if (todoFilter === 'active') {
        return todoSortedList.activeTodoList;
      }

      if (todoFilter === 'completed') {
        return todoSortedList.completedTodoList;
      }

      return todoList;
    },
  });

  const TodoMatchedListQuery = domain.query({
    name: 'TodoMatchedListQuery',
    impl: ({ get }) => {
      const todoFilteredList = get(TodoFilteredListQuery());
      const todoInput = get(todoInputDomain.query.TodoInputQuery());

      if (todoInput.length === 0) {
        return todoFilteredList;
      }

      const todoMatchedList = todoFilteredList.filter((todo) => {
        return todo.content.includes(todoInput);
      });

      return todoMatchedList;
    },
  });

  const TodoMatchedKeyListQuery = domain.query({
    name: 'TodoMatchedKeyListQuery',
    impl: ({ get }) => {
      return get(TodoMatchedListQuery()).map((todo) => todo.id);
    },
  });

  return {
    autorun: [],
    query: {
      ...todoListDomain.query,
      TodoMatchedListQuery,
      TodoFilteredListQuery,
      TodoMatchedKeyListQuery,
    },
    event: {
      ...todoListDomain.event,
    },
  };
});

const TodoAppFooterWidget = Remesh.widget((domain) => {
  const todoFilterDomain = domain.get(TodoFilterDomain);
  const todoListDomain = domain.get(TodoListDomain);

  return {
    query: {
      TodoItemLeftCountQuery: todoListDomain.query.TodoItemLeftCountQuery,
      ...todoFilterDomain.query,
    },
    event: {
      ...todoFilterDomain.event,
    },
  };
});

export const TodoAppHeaderDomain = Remesh.domain({
  name: 'TodoAppHeaderDomain',
  impl: (domain) => {
    const header = domain.use(TodoAppHeaderWidget());
    return {
      query: {
        ...header.query,
      },
      event: {
        ...header.event,
      },
    };
  },
});

export const TodoAppMainDomain = Remesh.domain({
  name: 'TodoAppMainDomain',
  impl: (domain) => {
    const main = domain.use(TodoAppMainWidget());
    return {
      query: {
        ...main.query,
      },
      event: {
        ...main.event,
      },
    };
  },
});

export const TodoAppFooterDomain = Remesh.domain({
  name: 'TodoAppFooterDomain',
  impl: (domain) => {
    const footer = domain.use(TodoAppFooterWidget());
    return {
      query: {
        ...footer.query,
      },
      event: {
        ...footer.event,
      },
    };
  },
});
