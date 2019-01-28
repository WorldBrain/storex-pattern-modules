import StorageManager from '@worldbrain/storex'
import { CollectionDefinition } from '@worldbrain/storex/lib/types/collections'
import { renderOperationArgs } from './operations';

export class StorageModuleRegistry<Modules = {[name : string] : StorageModule}> {
    modules : Modules = {} as any

    register<Module>(name : keyof Modules, module : Module) {
        this.modules[name as string] = module
    }
}

type StorageModuleOperationExecuter = ({name, context, render} : {name : string, context, render : () => any}) => Promise<any>
export class StorageModule {
    collections : {[name : string] : CollectionDefinition & {history?: Array<CollectionDefinition>}}
    operations : {[name : string] : {operation : string, collection? : string, args: {[key : string]: any}}}
    // private _storageManager : StorageManager
    private _operationExecuter? : StorageModuleOperationExecuter

    constructor({storageManager, operationExecuter} : {storageManager : StorageManager, operationExecuter? : StorageModuleOperationExecuter}) {
        // this._storageManager = storageManager
        this._operationExecuter = operationExecuter || _defaultOperationExecutor(storageManager)
    }

    protected async operation(name : string, context : {[key : string] : any}) {
        if (this._operationExecuter) {
            this._operationExecuter({name, context, render: () => {
                return _renderOperation(this.operations[name], context)
            }})
        }
    }
}

export function _defaultOperationExecutor(storageManager : StorageManager) {
    return async ({render} : {render : () => any}) => {
        const [operation, ...args] = render()
        return storageManager.backend.operation(operation, ...args)
    }
}

export function _renderOperation(operation : any, context : any) {
    const args = [operation.operation]
    if (operation.collection) {
        args.push(operation.collection)
    }
    args.push(renderOperationArgs(operation.args, context))
    return args
}
