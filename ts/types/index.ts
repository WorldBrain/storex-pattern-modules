import StorageManager, { CollectionDefinition } from "@worldbrain/storex";
import { PublicMethodDefinitions } from "./methods";
import { AccessRules } from "./access-rules";
export * from './methods'
export * from './access-rules'

export type StorageModuleConfig = {
    collections? : StorageModuleCollections,
    operations? : StorageOperationDefinitions,
    methods? : PublicMethodDefinitions,
    accessRules? : AccessRules
}
export type StorageModuleConstructorArgs = {storageManager : StorageManager, operationExecuter? : StorageOperationExecuter}
export type StorageModuleCollections = {[name : string] : CollectionDefinition & {history?: Array<CollectionDefinition>}}

export type StorageOperationDefinitions = {[name : string] : StorageOperationDefinition}
export type StorageOperationDefinition = MiscOperationDefinition | CreateObjectDefinition
export type CreateObjectDefinition = {operation: 'createObject', collection : string}
export type MiscOperationDefinition = {operation : string, collection? : string, args: {[key : string]: any}}

export type StorageOperationExecuter = ({name, context, method, debug, render} : {name : string, context, method : string, debug? : boolean | StorageModuleDebugConfig, render : () => any}) => Promise<any>

export interface StorageModuleDebugConfig {
    includeReturnValues? : boolean
    onlyModuleOperations? : string[]
    printDeepObjects? : boolean
}

