import { StorageModule, StorageModuleConfig } from '../../'
import { CollectionFields } from '@worldbrain/storex';

enum SharedListSubmissionOpenness {
    PRIVATE = 0,
    INVITE_ONLY = 1,
    AUTHENTICATED = 2,
    ANONYMOUS = 3,
}

const commonListEntryFields : CollectionFields = {
    createdWhen: { type: 'timestamp' },
    label: { type: 'string' },
}

export class SharedListStorage extends StorageModule {
    getConfig : () => StorageModuleConfig = () => ({
        collections: {
            user: {
                version: new Date('2019-02-05'),
                fields: {
                    displayName: { type: 'string' },
                },
            },
            sharedList: {
                version: new Date('2019-02-05'),
                fields: {
                    name: { type: 'string' },
                    createdWhen: { type: 'timestamp' },
                    updatedWhen: { type: 'timestamp' },
                    submissionOpenness: { type: 'int' },
                },
            },
            sharedListRole: {
                version: new Date('2019-02-05'),
                fields: {
                    type: { type: 'int' },
                },
                relationships: [
                    { connects: ['user', 'sharedList'] }
                ]
            },
            sharedListEntry: {
                version: new Date('2019-02-05'),
                fields: {
                    updatedWhen: { type: 'timestamp' },
                    ...commonListEntryFields,
                },
                relationships: [
                    { alias: 'list', childOf: 'sharedList' },
                    { alias: 'creator', childOf: 'user' },
                ]
            },
            sharedListSubmission: {
                version: new Date('2019-02-05'),
                fields: {
                    ...commonListEntryFields,
                },
                relationships: [
                    { alias: 'creator', childOf: 'user' },
                    { alias: 'list', childOf: 'sharedList' },
                ]
            },
        },
        operations: {
        },
        accessRules: {
            ownership: {
            },
            permissions: {
                sharedList: []
            },
            validation: {
            },
            constraints: [
            ]
        }
    })
}
