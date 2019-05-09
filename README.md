This module provides a base class and types for organizing storage logic based on [Storex](https://github.com/WorldBrain/storex) into modules. Each module:

* Defines and exposes some higher-level methods to work with your data (createUser, findPostsWithTags, etc.)
* Defines collections collections and their changes over time
* Defines the lower-level operations it uses to implement its higher-level methods
* Defines access rules for reading and manipulating data in a multi-user application (either cloud-based or decentralized)

This means you have extra metadata about your storage layer you can use to:

* Automatically generate web APIs with the same interface, allowing you to seamlessly move your storage logic between front- and back-end, as is for example done with the GraphQL [schema](https://github.com/WorldBrain/storex-graphql-schema/) and [client](https://github.com/WorldBrain/storex-graphql-client).
* Automatically give hints on where to places indices
* Generate graphs on which parts of your software perform what operations of your database
* Compile access rules to more specific systems that'd otherwise lock you in, like Firebase/Firestore
* Once we design different ways of specifying methods (in the future), this could even compile to Ethereum smart contracts to enable a massively improved workflow.

Basic usage
===========

A `StorageModule` is nothing more than a class accepting a storage manager, exposing a config, and some protected methods:

```

import { StorageModule, StorageModuleConfig, StorageModuleConstructorArgs } from '@worldbrain/storex-pattern-modules'

export class TodoListStorage extends StorageModule {
    constructor(options : StorageModuleConstructorArgs & { myArg1 : string, ... }) {
        super(options)
    }

    getConfig() : StorageModuleConfig { // This is the important part defining things other tools can use
        return {
            collections: {}
            operations: {},
            methods: {},
            accessRules: {}
        }
    }
    
    async createList(list : { label: string, items: Array<{label : string, done : boolean}> }) { // It's just a normal class, do whatever you want its methods
    
    }
}
```

Defining collections
====================

The `collections` field of the `StorageModuleConfig` is an object containing [collection definitions](https://github.com/WorldBrain/storex/blob/master/docs/collections.md):

```
export class TodoListStorage extends StorageModule {
    getConfig() : StorageModuleConfig {
        return {
            collections: {
                todoList: {
                    version: new Date('2019-05-05'),
                    fields: {
                        label: { type: 'string' },
                    }
                }
            }
        }
    }
}
```

Each collection can contain a `history` propery containing previous versions of the collection. This can be used as long as you need information about these old versions in your applications (for example, to enable data migrations of old exported data.)


Defining and executing operations
=================================

The `operations` field of the `StorageModuleConfig` contains templates of the operations this module will execute. These templates contain placeholders that will be filled in once operation is executed.

This example build on the one above, so `collections` is omitted here for sake of brevity:


```
export class TodoListStorage extends StorageModule {
    debug = true // You can optionally set this to true to see all the operations logged that your module is executing

    getConfig() : StorageModuleConfig { // This is the important part defining things other tools can use
        return {
            collections: {
                todoList: {
                    version: new Date('2019-05-05'),
                    fields: {
                        label: { type: 'string' },
                    }
                }
            },
            operations: {
                updateListTitle: {
                    operation: 'updateObject',
                    collection: 'todoList',
                    args: [  // These are the arguments in `storageManager.operation(collection, ...<args>)`
                        { id: '$id:pk' } // where clause,
                        { title: '$title:string' } // fields to update
                    ]
                },
                findSingleListByTitle: {
                    operation: 'findObject',
                    collection: 'todoList',
                    args: { // If args is not a list, it'll be simply the only argument
                        title: '$title:string',
                    }
                },
                createList: {
                    operation: 'createObject', // If the operation is `createObject`, `args` will automatically be filled in.
                    collection: 'todoList',
                },
            },
        }
    }
    
    async createList(list : { title : string }) : Promise<{ id : string | number }> {
        const { object } = await this.operation('createList', list)
        return { id: object.id }
    }
    
    async updateListTitle(title : string, options : { id : string | number } | { oldTitle : string }) {
        // Contrived example, but shows different ways to use `this.operation()`
    
        if ('oldTitle' in options) {
            const list = await this.operation('findSingleListByTitle', { title: options.oldTitle })
            if (!list) {
                throw new Error(`Could not find list with title '${options.oldTitle}'`)
            }
            await this.operation('updateListTitle', { id: list.id, title }) // These things passed in will be merged into where we've said '$id:pk' and '$title:string' before
        } else {
            await this.operation('updateListTitle', { id: options.id, title })
        }
    }
}
```

The `args` property of an operation template can contain `$placeholder:type` strings anywhere, to be later merged in when `this.operation()` is called. The type is supposed to be one of the same types you use in field collection definition, in order to optionally provide some run-time type checking. However, this is not implemented yet.


Defining methods
================

As long as you're using you're methods in the same application, you can call methods directly. However, once your business and storage logic start to live in separate places (like mobile clients and servers) you want to introduce some extra info on expected input and output to perform more validation (which is automatically done if you're using the GraphQL schema.)

This example build on the one above, so `collections` and `operations` are omitted here for sake of brevity:

```
export class TodoListStorage extends StorageModule {
    getConfig() : StorageModuleConfig { // This is the important part defining things other tools can use
        return {
            methods: {
                getList: { // Terminology borrowed from GraphQL, where 'query' only reads, and 'mutation' also writes.
                    type: 'query',
                    args: { id: 'number' }, // All these will be passed in as an object
                    returns: { collection: 'todoList' }
                },
                createList: {
                    type: 'mutation',
                    args: { title: 'string' }
                },
                updateListTitle: {
                    type: 'mutation',
                    args: {
                        title: { type: 'string', positional: true },
                        id: 'bool'
                    }
                },
            },
        }
    }
    
    async createList(list : { title : string }) : Promise<{ id : string | number }> {
        const { object } = await this.operation('createList', list)
        return { id: object.id }
    }
    
    async updateListTitle(title : string, options : { id : string | number }) {
        await this.operation('updateListTitle', { id: options.id, title })
    }
}
```

For more example on its usage, see the [unit tests of the GraphQL schema package](https://github.com/WorldBrain/storex-graphql-schema/blob/master/ts/modules.test.ts) and the [method type definition](https://github.com/WorldBrain/storex-pattern-modules/blob/master/ts/types/methods.ts)

Access rules
============

TBD
