import { StorageModule, StorageModuleConfig, StorageModuleConstructorArgs, StorageModuleDebugConfig } from '../../'
import { CollectionDefinitionMap } from '@worldbrain/storex';
import { StorageOperationDefinitions, AccessRules } from '../../types';

export interface SharedSyncLog {
    createDeviceId(options : {userId, sharedUntil : number}) : Promise<string>
    writeEntries(entries : SharedSyncLogEntry[]) : Promise<void>
    getUnsyncedEntries(options : { deviceId }) : Promise<SharedSyncLogEntry[]>
    markAsSeen(entries : Array<{ deviceId, createdOn : number }>, options : { deviceId }) : Promise<void>
}

export interface SharedSyncLogEntry {
    userId : any
    deviceId : any
    createdOn : number
    sharedOn : number
    data : string
}

export class SharedSyncLogStorage extends StorageModule implements SharedSyncLog {
    private autoPkType : 'string' | 'int'

    constructor(options : StorageModuleConstructorArgs & { autoPkType : 'string' | 'int' }) {
        super(options)
        this.autoPkType = options.autoPkType
    }

    getConfig : () => StorageModuleConfig = () =>
        createSharedSyncLogConfig({
            autoPkType: this.autoPkType,
            collections: {
                sharedSyncLogSeenEntry: {
                    version: new Date('2019-02-05'),
                    fields: {
                        creatorId: { type: this.autoPkType },
                        creatorDeviceId: { type: this.autoPkType },
                        retrieverDeviceId: { type: this.autoPkType },
                        createdOn: { type: 'timestamp' },
                    },
                    groupBy: [{ key: 'creatorDeviceId', subcollectionName: 'entries' }],
                }
            },
            operations: {
                createDeviceInfo: {
                    operation: 'createObject',
                    collection: 'sharedSyncLogDeviceInfo',
                },
                getDeviceInfo: {
                    operation: 'findObject',
                    collection: 'sharedSyncLogDeviceInfo',
                    args: {id: '$deviceId'}
                },
                updateSharedUntil: {
                    operation: 'updateObjects',
                    collection: 'sharedSyncLogDeviceInfo',
                    args: [{id: '$deviceId'}, {sharedUntil: '$sharedUntil:timestamp'}]
                },
                createLogEntry: {
                    operation: 'createObject',
                    collection: 'sharedSyncLogEntry',
                },
                findSyncEntries: {
                    operation: 'findObjects',
                    collection: 'sharedSyncLogEntry',
                    args: [
                        {
                            userId: '$userId',
                            sharedOn: {$gt: '$fromWhen:timestamp'},
                        },
                        {sort: ['sharedOn', 'asc']}
                    ]
                },
                insertSeenEntries: {
                    operation: 'executeBatch',
                    args: ['$operations']
                },
                retrieveSeenEntries: {
                    operation: 'findObjects',
                    collection: 'sharedSyncLogSeenEntry',
                    args: { retrieverDeviceId: '$deviceId' }
                },
            },
            accessRules: {
                ownership: {
                    sharedSyncLogDeviceInfo: {
                        field: 'userId',
                        access: 'full',
                    },
                    sharedSyncLogEntry: {
                        field: 'userId',
                        access: ['read', 'create', 'delete'],
                    },
                    sharedSyncLogSeenEntry: {
                        field: 'userId',
                        access: ['read', 'create', 'delete'],
                    },
                },
                validation: {
                    sharedSyncLogDeviceInfo: [
                        { field: 'sharedUntil', rule: { or: [
                            { and: [{ exists: '$oldValue' }, { eq: ['$value', '$context.now'] }] },
                            { and: [{ not: { exists: '$oldValue' } }, { eq: ['$value', null] }] },
                        ] } }
                    ]
                },
                constraints: [
                    {
                        prepare: [
                            {
                                placeholder: 'deviceCount', operation: 'countObjects', collection: 'sharedSyncLogDeviceInfo',
                                where: { userId: '$context.user.id' }
                            },
                        ],
                        rule: { lt: ['$deviceCount', 5] }
                    }
                ]
            }
        })

    async createDeviceId(options : {userId, sharedUntil : number}) : Promise<string> {
        return (await this.operation('createDeviceInfo', options)).object.id
    }

    async writeEntries(entries : SharedSyncLogEntry[]) : Promise<void> {
        for (const entry of entries) {
            await this.operation('createLogEntry', entry)
        }
    }

    async getUnsyncedEntries(options : { deviceId }) : Promise<SharedSyncLogEntry[]> {
        const deviceInfo = await this.operation('getDeviceInfo', options)
        if (!deviceInfo) {
            throw new Error(`Cannot find device ID: ${JSON.stringify(options.deviceId)}`)
        }
        const seenEntries = await this.operation('retrieveSeenEntries', { deviceId: options.deviceId })
        const seenSet = new Set(seenEntries.map(entry => entry.createdOn))
        const entries = await this.operation('findSyncEntries', { userId: deviceInfo.userId, fromWhen: 0 })
        const unseenEntries = entries.filter(entry => !seenSet.has(entry.createdOn))
        return unseenEntries
    }

    async markAsSeen(entries : Array<{ deviceId, createdOn : number }>, options : { creatorId, deviceId, now : number }) : Promise<void> {
        if (!entries.length) {
            return
        }

        await this.operation('insertSeenEntries', { operations: entries.map(entry => ({
            placeholder: 'seenEntry',
            operation: 'createObject',
            collection: 'sharedSyncLogSeenEntry',
            args: {
                creatorId: options.creatorId,
                creatorDeviceId: entry.deviceId,
                createdOn: options.now,
                entryCreatedOn: entry.createdOn,
                retrieverDeviceId: options.deviceId,
            }
        }))})
    }
}

export function createSharedSyncLogConfig(options : {
    autoPkType : 'int' | 'string',
    collections? : CollectionDefinitionMap,
    operations? : StorageOperationDefinitions,
    accessRules? : AccessRules,
}) : StorageModuleConfig {
    return {
        operations: options.operations,
        collections: {
            sharedSyncLogEntry: {
                version: new Date('2019-02-05'),
                fields: {
                    userId: { type: options.autoPkType },
                    deviceId: { type: options.autoPkType },
                    createdOn: { type: 'timestamp' }, // when was this entry created on a device
                    sharedOn: { type: 'timestamp' }, // when was this entry uploaded
                    data: { type: 'string' },
                },
            },
            sharedSyncLogDeviceInfo: {
                version: new Date('2019-02-05'),
                fields: {
                    userId: { type: options.autoPkType },
                    sharedUntil: { type: 'timestamp' },
                },
            },
            ...(options.collections || {})
        },
        methods: {
            createDeviceId: {
                type: 'mutation',
                args: {
                    userId: options.autoPkType,
                    sharedUntil: 'float'
                },
                returns: options.autoPkType
            },
            writeEntries: {
                type: 'mutation',
                args: {
                    entries: { type: { array: { collection: 'sharedSyncLogEntry' } }, positional: true },
                },
                returns: 'void'
            },
            getUnsyncedEntries: {
                type: 'query',
                args: {
                    deviceId: { type: options.autoPkType },
                },
                returns: { array: { collection: 'sharedSyncLogEntry' } },
            },
            markAsSeen: {
                type: 'mutation',
                args: {
                    entries: { type: { array: { object: { createdOn: 'float', deviceId: options.autoPkType }, singular: 'entry' } } },
                    deviceId: { type: options.autoPkType },
                },
                returns: 'void',
            }
        }
    }
}
