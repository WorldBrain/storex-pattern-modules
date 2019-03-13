import * as expect from 'expect'
import { FieldType } from '@worldbrain/storex/lib/types'
import { StorageModule } from '.'
import { installModuleSpy } from './spy';
import { StorageModuleConfig } from './types';

describe('Module spy', () => {
    it('should be able to able to tell which method an operation execute came from', async () => {
        class UserStorageModule extends StorageModule {
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
                            args: {
                                displayName: '$displayName:string'
                            }
                        }
                    }
                }
            }

            async registerUser({displayName} : {displayName : string}) {
                await this.operation('createUser', {displayName})
            }
        }

        const users = new UserStorageModule({storageManager: null, operationExecuter: async ({name, context, method, render}) => {
            executions.push({name, context, method, rendered: render()})
        }})
        installModuleSpy(users)

        const executions = []
        await users.registerUser({displayName: 'John Doe'})
        expect(executions).toEqual([
            {name: 'createUser', context: {displayName: 'John Doe'}, method: 'registerUser', rendered: [
                'createObject', 'user', {displayName: 'John Doe'}
            ]}
        ])
    })
})
