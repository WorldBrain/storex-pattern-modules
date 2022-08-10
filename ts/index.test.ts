import expect from 'expect'
import { FieldType } from '@worldbrain/storex/lib/types'
import { StorageModule, registerModuleCollections, registerModuleMapCollections } from '.'
import StorageManager from '@worldbrain/storex';
import { StorageModuleConfig } from './types';

class TestUserStorageModule extends StorageModule {
    getConfig() : StorageModuleConfig {
        return {
            collections: {
                user: {
                    version: new Date(2019, 1, 1),
                    fields: {
                        displayName: {type: 'text' as FieldType},
                    }
                }
            },
            operations: {
                createUser: {
                    operation: 'createObject',
                    collection: 'user',
                },
                updateDisplayNameById: {
                    operation: 'updateObject',
                    collection: 'user',
                    args: [
                        { id: '$id:auto-pk' },
                        { displayName: '$displayName:string' }
                    ]
                }
            }
        }
    }

    async registerUser({displayName} : {displayName : string}) {
        await this.operation('createUser', {displayName})
    }

    async updateDisplayNameById(id : any, displayName : string) {
        return await this.operation('updateDisplayNameById', {id, displayName})
    }
}

interface TestModules {
    users: TestUserStorageModule
}

describe('StorageModule', () => {
    it('should be able to execute operations', async () => {
        const executions = []
        const users = new TestUserStorageModule({storageManager: null, operationExecuter: async ({name, context, method, render}) => {
            executions.push({name, context, method, rendered: render()})
            return 'bla'
        }})

        expect(await users.updateDisplayNameById(1, 'John Doe')).toEqual('bla')
        expect(executions).toEqual([
            {name: 'updateDisplayNameById', context: {id: 1, displayName: 'John Doe'}, rendered: [
                'updateObject', 'user', {id: 1}, {displayName: 'John Doe'}
            ]}
        ])
    })

    it('should be able to automatically generate createObject operations', async () => {
        const executions = []
        const users = new TestUserStorageModule({storageManager: null, operationExecuter: async ({name, context, method, render}) => {
            executions.push({name, context, method, rendered: render()})
        }})

        await users.registerUser({displayName: 'John Doe'})
        expect(executions).toEqual([
            {name: 'createUser', context: {displayName: 'John Doe'}, rendered: [
                'createObject', 'user', {displayName: 'John Doe'}
            ]}
        ])
    })
})

describe('Storage module helper functions', () => {
    it('should be able to register all collections in a module map', async () => {
        const storageManager = new StorageManager({ backend: {
            configure: () => null,
        } as any })
        const modules = { users: new TestUserStorageModule({ storageManager }) }
        registerModuleMapCollections(storageManager.registry, modules)
        await storageManager.finishInitialization()

        expect(storageManager.registry.getCollectionsByVersion(new Date(2019, 1, 1))).toEqual(expect.objectContaining({
            user: expect.objectContaining({
                fields: expect.objectContaining({
                    displayName: expect.objectContaining({type: 'text' as FieldType}),
                })
            })
        }))
    })

    it('should be able to register all collections in a module', async () => {
        const storageManager = new StorageManager({backend: {
            configure: () => null,
        } as any})
        const usersModule = new TestUserStorageModule({storageManager})
        registerModuleCollections(storageManager.registry, usersModule)
        await storageManager.finishInitialization()

        expect(storageManager.registry.getCollectionsByVersion(new Date(2019, 1, 1))).toEqual(expect.objectContaining({
            user: expect.objectContaining({
                fields: expect.objectContaining({
                    displayName: expect.objectContaining({type: 'text' as FieldType}),
                })
            })
        }))
    })
})