import React, { ComponentPropsWithoutRef, useEffect } from 'react';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

import { Remesh } from '../remesh';
import {
  useRemeshDomain,
  useRemeshEmit,
  useRemeshQuery,
} from '../remesh/react';

import { ListWidget } from '../remesh/widgets/list';

type Name = {
  name: string;
  surname: string;
};

type NameItem = {
  id: string;
} & Name;

export const CRUD = Remesh.domain({
  name: 'CRUD',
  impl: (domain) => {
    let nameUid = 0;

    const nameListDomain = domain.use(
      ListWidget<NameItem>({
        name: 'Name',
        getKey: (item) => item.id,
        createItem: (key) => {
          return {
            id: key,
            name: '',
            surname: '',
          };
        },
      })
    );

    const FilterPrefixState = domain.state({
      name: 'FilterPrefix',
      default: '',
    });

    const FilterPrefixQuery = domain.query({
      name: 'FilterPrefix',
      impl: ({ get }) => {
        return get(FilterPrefixState());
      },
    });

    const updateFilterPrefix = domain.command({
      name: 'UpdateFilterPrefix',
      impl: ({}, prefix: string) => {
        return FilterPrefixState().new(prefix);
      },
    });

    const CreatedState = domain.state<Name>({
      name: 'Created',
      default: {
        name: '',
        surname: '',
      },
    });

    const CreatedQuery = domain.query({
      name: 'Created',
      impl: ({ get }) => {
        return get(CreatedState());
      },
    });

    const updateCreated = domain.command({
      name: 'UpdateCreated',
      impl: ({ get }, name: Partial<Name>) => {
        const currentName = get(CreatedState());
        return CreatedState().new({
          ...currentName,
          ...name,
        });
      },
    });

    const SelectedState = domain.state<NameItem | null>({
      name: 'Selected',
      default: null,
    });

    const SelectedQuery = domain.query({
      name: 'Selected',
      impl: ({ get }) => {
        return get(SelectedState());
      },
    });

    const selectItem = domain.command({
      name: 'Select',
      impl: ({ get }, itemId: string | null) => {
        if (itemId === null) {
          return SelectedState().new(null);
        }

        const targetItem = get(nameListDomain.query.ItemQuery(itemId));

        return SelectedState().new(targetItem);
      },
    });

    const updateSelectedName = domain.command({
      name: 'UpdateSelectedName',
      impl: ({ get }, name: Partial<Name>) => {
        const selected = get(SelectedState());

        if (selected === null) {
          return [];
        }

        return SelectedState().new({
          ...selected,
          ...name,
        });
      },
    });

    const FilteredListQuery = domain.query({
      name: 'FilteredListQuery',
      impl: ({ get }) => {
        const filterPrefix = get(FilterPrefixState());
        const nameList = get(nameListDomain.query.ItemListQuery());

        if (filterPrefix === '') {
          return nameList;
        }

        return nameList.filter((item) => item.surname.startsWith(filterPrefix));
      },
    });

    const syncSelected = domain.command({
      name: 'SyncSelected',
      impl: ({ get }) => {
        const selected = get(SelectedState());

        if (selected === null) {
          return [];
        }

        return nameListDomain.event.updateItem(selected);
      },
    });

    const createNameItem = domain.command({
      name: 'CreateNameItem',
      impl: ({ get }) => {
        const created = get(CreatedState());
        const newItem = {
          id: `${nameUid++}`,
          ...created,
        };

        return [
          nameListDomain.event.addItem(newItem),
          updateCreated({ name: '', surname: '' }),
        ];
      },
    });

    const mainTask = domain.task({
      name: 'MainTask',
      impl: ({ fromEvent }) => {
        const updateFilterPrefix$ = fromEvent(updateFilterPrefix.Event).pipe(
          map((prefix) => {
            return updateFilterPrefix(prefix);
          })
        );

        const updateCreated$ = fromEvent(updateCreated.Event).pipe(
          map((name) => {
            return updateCreated(name);
          })
        );

        const select$ = fromEvent(selectItem.Event).pipe(
          map((item) => {
            return selectItem(item);
          })
        );

        const updateSelectedName$ = fromEvent(updateSelectedName.Event).pipe(
          map((name) => {
            return updateSelectedName(name);
          })
        );

        const createNameItem$ = fromEvent(createNameItem.Event).pipe(
          map((name) => {
            return createNameItem(name);
          })
        );

        const syncSelected$ = fromEvent(syncSelected.Event).pipe(
          map(() => {
            return syncSelected();
          })
        );

        return merge(
          updateFilterPrefix$,
          updateCreated$,
          select$,
          updateSelectedName$,
          createNameItem$,
          syncSelected$
        );
      },
    });

    return {
      autorun: [mainTask],
      query: {
        ...nameListDomain.query,
        FilteredListQuery,
        SelectedQuery,
        FilterPrefixQuery,
        CreatedQuery,
      },
      event: {
        ...nameListDomain.event,
        updateFilterPrefix: updateFilterPrefix.Event,
        selectItem: selectItem.Event,
        updateCreated: updateCreated.Event,
        updateSelectedName: updateSelectedName.Event,
        createNameItem: createNameItem.Event,
        syncSelected: syncSelected.Event,
      },
    };
  },
});

type OuterClickWrapperProps = ComponentPropsWithoutRef<'div'> & {
  onOuterClick?: (event: MouseEvent) => void;
};

const OuterClickWrapper = (props: OuterClickWrapperProps) => {
  const { onOuterClick, ...restProps } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOuterClick?.(event);
      }
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return <div ref={containerRef} {...restProps}></div>;
};

export const CRUDApp = () => {
  const domain = useRemeshDomain(CRUD);
  const emit = useRemeshEmit();
  const filteredList = useRemeshQuery(domain.query.FilteredListQuery());
  const filter = useRemeshQuery(domain.query.FilterPrefixQuery());
  const created = useRemeshQuery(domain.query.CreatedQuery());
  const selected = useRemeshQuery(domain.query.SelectedQuery());

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    emit(domain.event.updateFilterPrefix(e.target.value));
  };

  const handleSelect = (itemId: string | null) => {
    emit(domain.event.selectItem(itemId));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selected) {
      emit(
        domain.event.updateSelectedName({
          name: e.target.value,
        })
      );
    } else {
      emit(domain.event.updateCreated({ name: e.target.value }));
    }
  };

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selected) {
      emit(
        domain.event.updateSelectedName({
          surname: e.target.value,
        })
      );
    } else {
      emit(domain.event.updateCreated({ surname: e.target.value }));
    }
  };

  const handleCreate = () => {
    if (selected === null) {
      emit(domain.event.createNameItem());
    }
  };

  const handleSync = () => {
    if (selected) {
      emit(domain.event.syncSelected());
    }
  };

  const handleDelete = () => {
    if (selected) {
      emit(domain.event.removeItem(selected.id));
      emit(domain.event.selectItem(null));
    }
  };

  return (
    <OuterClickWrapper
      style={{
        width: 400,
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
      onOuterClick={() => {
        handleSelect(null);
      }}
    >
      <div>
        <label htmlFor="">Filter prefix</label>
        <input type="text" value={filter} onChange={handleFilterChange} />
      </div>
      <div
        style={{
          display: 'flex',
        }}
      >
        <div
          style={{
            width: '50%',
            height: 100,
            border: '1px solid #eaeaea',
            overflow: 'scroll',
          }}
        >
          {filteredList.map((item) => {
            const fullName = item.name + ', ' + item.surname;

            return (
              <div
                key={item.id}
                style={{
                  background: selected?.id === item.id ? 'blue' : '',
                  color: selected?.id === item.id ? 'white' : '',
                }}
                onClick={() => {
                  handleSelect(item.id);
                }}
              >
                {fullName}
              </div>
            );
          })}
        </div>
        <div style={{ width: '50%', padding: 10 }}>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={selected ? selected.name : created.name}
              onChange={handleNameChange}
            />
          </div>
          <div>
            <label>Surname:</label>
            <input
              type="text"
              value={selected ? selected.surname : created.surname}
              onChange={handleSurnameChange}
            />
          </div>
        </div>

        <div>
          <button
            disabled={selected !== null}
            style={{ marginRight: 10 }}
            onClick={handleCreate}
          >
            Create
          </button>
          <button
            disabled={selected === null}
            style={{ marginRight: 10 }}
            onClick={handleSync}
          >
            Update
          </button>
          <button
            disabled={selected === null}
            style={{ marginRight: 10 }}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </OuterClickWrapper>
  );
};
