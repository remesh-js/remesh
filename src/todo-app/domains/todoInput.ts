import { Remesh } from '../../remesh';

export const TodoInputDomain = Remesh.domain({
    name: 'TodoInputDomain',
    impl: (domain) => {
        const TodoInputState = domain.state({
            name: 'TodoInputState',
            default: '',
        });

        const updateTodoInput = domain.command({
            name: 'updateTodoInput',
            impl: ({ }, newTodoInput: string) => {
                return TodoInputState().new(newTodoInput);
            }
        })

        return {
            query: {
                TodoInputQuery: TodoInputState.Query
            },
            command: {
                updateTodoInput
            },
        };
    },
});
