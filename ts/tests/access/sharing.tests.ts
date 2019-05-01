import { StorageModule, StorageModuleConfig } from '../../'
import { CollectionFields } from '@worldbrain/storex';
import { FindObjectPermissionPreparation } from '../../types';

enum SharedListOpenness {
    PRIVATE = 0,
    INVITE_ONLY = 1,
    AUTHENTICATED = 2,
    EVERYONE = 3,
}
enum SharedListRole {
    NONE = 0,
    COMMENTOR = 5, // can only comment, but not add suggestions
    SUGGESTOR = 10, // can suggest, but not add
    CONTRIBUTOR = 15, // can add, but not delete or modify
    EDITOR = 20,
    ADMIN = 25,
}

const commonListEntryFields : CollectionFields = {
    createdWhen: { type: 'timestamp' },
    label: { type: 'string' },
}

const getSharedListRoleRule = (options : { placeholder : string }) : FindObjectPermissionPreparation => ({
    placeholder: options.placeholder, operation: 'findObject', collection: 'sharedListRole',
    where: { user: '$context.user.id', list: '$value.id' }
})
const getSharedListRule = (options : { placeholder : string }) : FindObjectPermissionPreparation => ({
    placeholder: options.placeholder, operation: 'findObject', collection: 'sharedList',
    where: { id: '$value.list' }
})

export class SharedListStorage extends StorageModule {
    getConfig : () => StorageModuleConfig = () : StorageModuleConfig => ({
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
                    title: { type: 'string' },
                    createdWhen: { type: 'timestamp' },
                    updatedWhen: { type: 'timestamp' },
                    readOpenness: { type: 'int' },
                    submissionOpenness: { type: 'int' },
                },
                relationships: [
                    { alias: 'creator', childOf: 'user' }
                ]
            },
            sharedSubList: {
                version: new Date('2019-02-05'),
                fields: {
                },
                relationships: [
                    { alias: 'parent', childOf: 'sharedList' },
                    { alias: 'child', childOf: 'sharedList' },
                ]
            },
            sharedListRole: {
                version: new Date('2019-02-05'),
                fields: {
                    type: { type: 'int' },
                },
                relationships: [
                    { connects: ['user', 'sharedList'] }
                ],
                groupBy: [{ key: 'sharedList', subcollectionName: 'users' }],
                pkIndex: 'user'
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
                ],
                groupBy: [{ key: 'list', subcollectionName: 'entries' }],
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
                sharedList: {
                    create: {
                        rule: {
                            eq: ['$value.creator', '$context.user.id']
                        },
                    },
                    read: {
                        prepare: [
                            getSharedListRoleRule({ placeholder: 'userRole' })
                        ],
                        rule: { or: [
                            { and: [
                                { eq: ['$value.readOpenness', SharedListOpenness.PRIVATE] },
                                { gt: ['$userRole.type', SharedListRole.NONE] }
                            ] },
                            { and: [
                                { eq: ['$value.readOpenness', SharedListOpenness.AUTHENTICATED] },
                                { ne: ['$user', null] }
                            ] },
                            { eq: ['$value.readOpenness', SharedListOpenness.EVERYONE] }
                        ] }
                    },
                    delete: {
                        prepare: [
                            getSharedListRoleRule({ placeholder: 'userRole' })
                        ],
                        rule: {
                            eq: ['$userRole.type', SharedListRole.ADMIN]
                        }
                    }
                },
                sharedListEntry: {
                    list: {
                        group: 'list',
                        prepare: [
                            getSharedListRule({ placeholder: 'list' }),
                            getSharedListRoleRule({ placeholder: 'userRole' }),
                        ],
                        rule: { or: [
                            { eq: ['$list.readOpenness', SharedListOpenness.EVERYONE] },
                            { gt: ['$role.type', SharedListRole.NONE] },
                        ] }
                    },
                    create: {
                        prepare: [
                            getSharedListRoleRule({ placeholder: 'userRole' }),
                        ],
                        rule: { or: [
                            { gt: ['$role.type', SharedListRole.CONTRIBUTOR] },
                        ] }
                    },
                    update: {
                        prepare: [
                            getSharedListRoleRule({ placeholder: 'userRole' }),
                        ],
                        rule: { or: [
                            { gt: ['$role.type', SharedListRole.EDITOR] },
                        ] }
                    },
                    delete: {
                        prepare: [
                            getSharedListRoleRule({ placeholder: 'userRole' })
                        ],
                        rule: {
                            eq: ['$userRole.type', SharedListRole.ADMIN]
                        }
                    },
                },
                sharedListRole: {
                    create: {
                        prepare: [
                            getSharedListRoleRule({ placeholder: 'userRole' }),
                            getSharedListRule({ placeholder: 'list' }),
                        ],
                        rule: { or: [
                            { eq: ['$list.creator', '$context.user.id'] },
                            { eq: ['$userRole.type', SharedListRole.ADMIN] },
                        ] }
                    },
                }
            },
        }
    })
}
