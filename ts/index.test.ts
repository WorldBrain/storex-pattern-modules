import * as expect from 'expect'
import { FieldType } from '@worldbrain/storex/lib/types'
import { StorageModuleRegistry, StorageModule } from '.'

describe('Module registry', () => {
    it('should be able to report operations', async () => {
        class UserStorageModule extends StorageModule {
            collections = {
                user: {
                    version: new Date(2019, 1, 1),
                    fields: {
                        displayName: {type: 'text' as FieldType},
                    }
                }
            }
            operations = {
                createUser: {
                    operation: 'createObject',
                    collection: 'user',
                    args: {
                        displayName: '$displayName:string'
                    }
                }
            }

            async registerUser({displayName} : {displayName : string}) {
                await this.operation('createUser', {displayName})
            }
        }

        interface Modules {
            users: UserStorageModule
        }
        const registry = new StorageModuleRegistry<Modules>()
        registry.register('users', new UserStorageModule({storageManager: null, operationExecuter: async ({name, context, render}) => {
            executions.push({name, context, rendered: render()})
        }}))

        const executions = []
        await registry.modules.users.registerUser({displayName: 'John Doe'})
        expect(executions).toEqual([
            {name: 'createUser', context: {displayName: 'John Doe'}, rendered: [
                'createObject', 'user', {displayName: 'John Doe'}
            ]}
        ])
    })
})
