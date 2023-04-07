import { Query } from './cqrs'
import { Struct, Num, Str, Bool, InferData, List, Union, Literal, InferQuery, InferMutation, Optional } from './schema'

class Todo extends Struct {
  id = Num
  content = Str
  completed = Bool
}

type TodoFilterData = InferData<typeof TodoFilter>

const queryTodoByFilter = (filter: TodoFilterData) => {
  return Todo.query((todo) => {
    if (filter === 'active') {
      return !todo.completed
    }

    if (filter === 'completed') {
      return todo.completed
    }

    return true
  })
}

class TodoQuery extends Query {
  impl(filter: TodoFilterData) {
    const todo = this.assert(queryTodoByFilter(filter))
    return todo
  }
}

const TodoList = List(Todo)

const TodoFilter = Union(Literal('active'), Literal('all'), Literal('completed'))

class TodoApp extends Struct {
  todos = TodoList
  filter = TodoFilter
  input = Str
}

type TodoAppData = InferData<TodoApp>
type TodoAppQuery = InferQuery<TodoApp>
type TodoAppMutation = InferMutation<TodoApp>

class Tree extends Struct {
  value = Num
  children = List(Tree)
}

type TreeData = InferData<Tree>
type TreeQuery = InferQuery<Tree>
type TreeMutation = InferMutation<Tree>

class LinkedList extends Struct {
  value = Num
  next? = Optional(LinkedList)
}

type LinkedListData = InferData<LinkedList>
type LinkedListQuery = InferQuery<LinkedList>
type LinkedListMutation = InferMutation<LinkedList>

class Category extends Struct {
  name = Str
  subcategories = List(Category)
}

type CategoryData = InferData<Category>
type CategoryQuery = InferQuery<Category>
type CategoryMutation = InferMutation<Category>

const data: CategoryData = {
  name: 'People',
  subcategories: [
    {
      name: 'Politicians',
      subcategories: [
        {
          name: 'Presidents',
          subcategories: [],
        },
      ],
    },
  ],
}
