# remesh

## 2.0.0

### remove `remesh/module/text` & `remesh/module/switch`

`text-module` and `switch-module` are to simple to be useful, you can implement them yourself in your application.

### remove `fromCommand` in `domain.effect`

`fromCommand` is confusing, just:

- define an event via `domain.event`
- return event in `domain.command`
- use `fromEvent` in `domain.effect`

### add `tree-module`

`remesh/modules/tree` can be used to management tree structure data.

### restrict the name of `remesh-module`

- The `options.name` in `async-module` now should end with `AsyncModule`, eg: `UserAsyncModule`
- The `options.name` in `list-module` now should end with `ListModule`, eg: `UserListModule`
- The `options.name` in `tree-module` now should end with `TreeModule`, eg: `MyTreeModule`

When defining you own `remesh-module`, you should follow the naming convention. `DomainConceptName<'MyModule'>` will be helped to generate the `type` of `remesh-module`.

### make `domain.event` subscribe-only outside of `domain`

Now it's not allowed to emit event outside of `domain`, you should use `domain.command` to emit event indirectly, so it can be verified by `domain.command`.
