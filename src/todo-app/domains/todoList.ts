import { map } from 'rxjs/operators';
import { Remesh, RemeshEventPayload } from '../../remesh';

import { ListWidget } from '../../remesh/widgets/list';

import { merge, of } from 'rxjs';

export type Todo = {
  id: string;
  content: string;
  completed: boolean;
};

export type AddTodoFailedEventData = {
  message: string;
};

export type AddTodoSucceededEventData = {
  newTodo: Todo;
};

export type UpdateTodoPayload = {
  todoId: string;
  content: string;
};

export const TodoListDomain = Remesh.domain({
  name: 'TodoListDomain',
  impl: (domain) => {
    const listWidget = domain.use(
      ListWidget({
        name: 'TodoList',
        getKey: (todo: Todo) => {
          return todo.id;
        },
        createItem: (todoId): Todo => {
          return {
            id: todoId,
            content: '',
            completed: false,
          };
        },
      })
    );

    const AddTodoFailedEvent = domain.event<AddTodoFailedEventData>({
      name: 'AddTodoFailedEvent',
    });

    const AddTodoSuccessEvent = domain.event<AddTodoSucceededEventData>({
      name: 'AddTodoSuccessEvent',
    });

    let todoUid = 0;

    const addTodo = domain.command({
      name: 'addTodo',
      impl: ({ }, todoContent: string) => {
        if (todoContent.length === 0) {
          return AddTodoFailedEvent({
            message: `Unexpected empty todo input`,
          });
        }

        const newTodo: Todo = {
          id: todoUid++ + '',
          content: todoContent,
          completed: false,
        };

        return [
          listWidget.command.addItem(newTodo),
          AddTodoSuccessEvent({ newTodo }),
        ];
      },
    });

    const updateTodo = domain.command({
      name: 'updateTodo',
      impl: ({ get }, payload: UpdateTodoPayload) => {
        if (payload.content.length === 0) {
          return listWidget.command.removeItem(payload.todoId);
        }

        const todo = get(listWidget.query.ItemQuery(payload.todoId));

        return listWidget.command.updateItem({
          ...todo,
          content: payload.content,
        });
      },
    });

    const toggleTodo = domain.command({
      name: 'toggleTodo',
      impl: ({ get }, todoId: string) => {
        const todo = get(listWidget.query.ItemQuery(todoId));

        return listWidget.command.updateItem({
          ...todo,
          completed: !todo.completed,
        });
      },
    });

    const toggleAllTodos = domain.command({
      name: 'toggleAllTodos',
      impl: ({ get }) => {
        const isAllCompleted = get(IsAllCompletedQuery());
        const todoList = get(listWidget.query.ItemListQuery());

        return todoList.map((todo) => {
          return listWidget.command.updateItem({
            ...todo,
            completed: !isAllCompleted,
          });
        });
      },
    });

    const TodoSortedListQuery = domain.query({
      name: 'TodoSortedListQuery',
      impl: ({ get }) => {
        const todoList = get(listWidget.query.ItemListQuery());
        const activeTodoList: Todo[] = [];
        const completedTodoList: Todo[] = [];

        for (const todo of todoList) {
          if (todo.completed) {
            completedTodoList.push(todo);
          } else {
            activeTodoList.push(todo);
          }
        }

        return {
          activeTodoList,
          completedTodoList,
        };
      },
    });

    const IsAllCompletedQuery = domain.query({
      name: 'IsAllCompletedQuery',
      impl: ({ get }) => {
        const { activeTodoList, completedTodoList } = get(
          TodoSortedListQuery()
        );

        return activeTodoList.length === 0 && completedTodoList.length > 0;
      },
    });

    const TodoItemLeftCountQuery = domain.query({
      name: 'TodoItemLeftCountQuery',
      impl: ({ get }) => {
        const { activeTodoList } = get(TodoSortedListQuery());
        return activeTodoList.length;
      },
    });

    domain.command$({
      name: 'TodoListPreloadTask',
      impl: ({ }) => {
        const todoList = domain.getExtern(TodoListExtern);
        return of(todoList.map(listWidget.command.addItem))
      },
    });

    return {
      event: {
        AddTodoFailedEvent,
        AddTodoSuccessEvent,
      },
      command: {
        addTodo,
        updateTodo,
        removeTodo: listWidget.command.removeItem,
        toggleTodo,
        toggleAllTodos,
      },
      query: {
        TodoKeyListQuery: listWidget.query.KeyListQuery,
        TodoListQuery: listWidget.query.ItemListQuery,
        IsAllCompletedQuery,
        TodoSortedListQuery,
        TodoItemLeftCountQuery,
        TodoItemQuery: listWidget.query.ItemQuery,
      },
    };
  },
});

export const TodoListExtern = Remesh.extern({
  name: 'TodoListExtern',
  default: [] as Todo[]
});
