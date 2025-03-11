import StorageManager, {
    StorageRegistry,
    isChildOfRelationship,
    getChildOfRelationshipTarget,
} from '@worldbrain/storex'
import { renderOperationArgs } from './operations'
import {
    StorageModuleConstructorArgs,
    StorageModuleDebugConfig,
    StorageOperationExecuter,
    StorageModuleConfig,
    StorageModuleHistory,
} from './types'
import inspect from 'util'

export * from './types'

export interface StorageModuleInterface {
    getConfig(): StorageModuleConfig
}

export abstract class StorageModule implements StorageModuleInterface {
    // private _storageManager : StorageManager
    private _operationExecuter?: StorageOperationExecuter
    private _config: StorageModuleConfig
    debug: boolean | StorageModuleDebugConfig = false

    constructor({
        storageManager,
        operationExecuter,
    }: StorageModuleConstructorArgs) {
        this._operationExecuter =
            operationExecuter || _defaultOperationExecutor(storageManager)
    }

    abstract getConfig(): StorageModuleConfig

    private _initConfig() {
        if (!this._config) {
            this._config = this.getConfig()
            _autoGenerateOperations(this)
        }
    }

    get collections() {
        this._initConfig()
        return this._config.collections
    }

    get operations() {
        this._initConfig()
        return this._config.operations
    }

    protected async operation(
        name: string,
        context: { [key: string]: any },
        _method?: string,
    ) {
        if (!this.operations[name]) {
            throw new Error(
                `Attempted to execute operation "${name}" which is not registered in the StorageModule's config`,
            )
        }
        if (this._operationExecuter) {
            return this._operationExecuter({
                name,
                context,
                debug: this.debug,
                method: _method,
                render: () => {
                    const removeUndefinedValues =
                        this.operations[name].operation === 'createObject'
                    return _renderOperation(this.operations[name], context, {
                        removeUndefinedValues,
                    })
                },
            })
        }
    }
}

export function registerModuleMapCollections(
    collectionRegistry: StorageRegistry,
    modules: { [name: string]: StorageModuleInterface },
    options: { version?: Date } = {},
) {
    for (const storageModule of Object.values(modules)) {
        registerModuleCollections(collectionRegistry, storageModule, options)
    }
}

export function registerModuleCollections(
    collectionRegistry: StorageRegistry,
    storageModule: StorageModuleInterface,
    options: { version?: Date } = {},
) {
    options.version = options.version || new Date()

    for (const [collectionName, collectionDefinition] of Object.entries(
        storageModule.getConfig().collections || {},
    )) {
        const history = [
            collectionDefinition,
            ...(collectionDefinition.history || []),
        ]
        collectionRegistry.registerCollection(
            collectionName,
            history
                .filter(
                    (definition) =>
                        definition.version.getTime() <=
                        options.version.getTime(),
                )
                .map((definition) => ({ ...definition })),
        )
    }
}

export function _defaultOperationExecutor(storageManager: StorageManager) {
    return async ({
        name,
        render,
        debug,
    }: {
        name: string
        render: () => any
        debug?: boolean | StorageModuleDebugConfig
    }) => {
        const [operation, ...args] = render()
        if (debug) {
            _debugOperation('pre-op', name, operation, args, null, debug)
        }
        const result = await storageManager.operation(operation, ...args)
        if (debug && (debug as StorageModuleDebugConfig).includeReturnValues) {
            _debugOperation('post-op', name, operation, args, result, debug)
        }
        return result
    }
}

export function _debugOperation(
    stage: 'pre-op' | 'post-op',
    moduleOperation: string,
    backendOperation: string,
    args: any[],
    result: any | undefined,
    config: boolean | StorageModuleDebugConfig,
) {
    const print = (msg, operation, object) => {
        if ((config as StorageModuleDebugConfig).printDeepObjects) {
            object = inspect(object, false, null, true)
        }
        console.debug(msg, operation, object)
    }
    const show = () => {
        if (stage === 'pre-op') {
            print(
                'DEBUG - executing storage operation "%s" with args',
                backendOperation,
                args,
            )
        } else {
            print(
                'DEBUG - storage backend operation "%s" returned',
                backendOperation,
                result,
            )
        }
    }

    if (typeof config === 'boolean') {
        show()
        return
    }

    const maybeDebugConfig = config as StorageModuleDebugConfig
    const onlyOperations = maybeDebugConfig.onlyModuleOperations
    if (!onlyOperations || onlyOperations.indexOf(moduleOperation) >= 0) {
        show()
    }
}

export function _renderOperation(
    operation: any,
    context: any,
    options?: { removeUndefinedValues?: boolean },
) {
    const args = [operation.operation]
    if (operation.collection) {
        args.push(operation.collection)
    }

    const rendered = renderOperationArgs(operation.args, context, options)
    if (operation.args instanceof Array) {
        args.push(...rendered)
    } else {
        args.push(rendered)
    }
    return args
}

export function _autoGenerateOperations(storageModule: StorageModule) {
    for (const operationDefinition of Object.values(storageModule.operations)) {
        if (operationDefinition.operation === 'createObject') {
            if (operationDefinition['args']) {
                continue
            }

            let collectionDefinition =
                storageModule.collections[operationDefinition.collection]
            if (collectionDefinition instanceof Array) {
                collectionDefinition = collectionDefinition.slice(-1)[0]
            }

            const args = (operationDefinition['args'] = {})
            for (const [fieldName, fieldDefinition] of Object.entries(
                collectionDefinition.fields,
            )) {
                args[fieldName] = `$${fieldName}:${fieldDefinition.type}`
            }
            for (const relationship of collectionDefinition.relationships ||
                []) {
                if (isChildOfRelationship(relationship)) {
                    const alias =
                        relationship.alias ||
                        getChildOfRelationshipTarget(relationship)
                    args[alias] = `$${alias}`
                }
            }
        }
    }
}

export function withHistory(
    moduleConfig: StorageModuleConfig & { history: StorageModuleHistory },
): StorageModuleConfig {
    for (const [collectionName, collectionHistory] of Object.entries(
        moduleConfig.history.collections,
    )) {
        if (!moduleConfig.collections) {
            continue
        }

        moduleConfig.collections[collectionName].history = collectionHistory
    }
    return moduleConfig
}
