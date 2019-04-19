import StorageManager, { PrimitiveFieldType, CollectionDefinition } from "@worldbrain/storex";

export type CreateObjectDefinition = {operation: 'createObject', collection : string}
export type MiscOperationDefinition = {operation : string, collection? : string, args: {[key : string]: any}}
export type StorageOperationDefinition = MiscOperationDefinition | CreateObjectDefinition
export type StorageOperationDefinitions = {[name : string] : StorageOperationDefinition}

export type StorageOperationExecuter = ({name, context, method, debug, render} : {name : string, context, method : string, debug? : boolean | StorageModuleDebugConfig, render : () => any}) => Promise<any>
export type StorageModuleCollections = {[name : string] : CollectionDefinition & {history?: Array<CollectionDefinition>}}
export type StorageModuleConfig = {collections? : StorageModuleCollections, operations? : StorageOperationDefinitions, methods? : PublicMethodDefinitions}
export type StorageModuleConstructorArgs = {storageManager : StorageManager, operationExecuter? : StorageOperationExecuter}
export interface StorageModuleDebugConfig {
    includeReturnValues? : boolean
    onlyModuleOperations? : string[]
    printDeepObjects? : boolean
}

export type PublicMethodDefinitions = {[name : string] : PublicMethodDefinition}
export interface PublicMethodDefinition {
    type : 'query' | 'mutation'
    args : PublicMethodArgs
    returns : PublicMethodValueType | 'void'
}

export type PublicMethodArgs = {[name : string] : PublicMethodArg}
export type PublicMethodArg = PublicMethodValue<PublicMethodDetailedArg>
export type PublicMethodDetailedArg = PublicMethodDetailedValue & {positional? : true}

export type PublicMethodValues = {[key : string] : PublicMethodValue}
export type PublicMethodValue<Detailed = PublicMethodDetailedValue, ValueType = PublicMethodValueType> = ValueType | Detailed
export type PublicMethodDetailedValue<ValueType = PublicMethodValueType> = { type : ValueType, optional? : boolean }
export const isDetailedPublicMethodValue = (arg : PublicMethodValue) : arg is PublicMethodDetailedValue => !!arg['type']
export const ensureDetailedPublicMethodValue = (arg : PublicMethodValue) : PublicMethodDetailedValue =>
    isDetailedPublicMethodValue(arg) ? arg : { type: arg }

export type PublicMethodValueType = PublicMethodScalarType | PublicMethodCollectionType | PublicMethodArrayType | PublicMethodObjectType
export type PublicMethodScalarType = PrimitiveFieldType
export type PublicMethodArrayType = { array: PublicMethodValueType }
export const isPublicMethodArrayType = (valueType : PublicMethodValueType) : valueType is PublicMethodArrayType =>
    !!valueType['array']
export type PublicMethodObjectType = { object: PublicMethodValues, singular : string }
export const isPublicMethodObjectType = (valueType : PublicMethodValueType) : valueType is PublicMethodObjectType =>
    !!valueType['object']
export type PublicMethodCollectionType = { collection : string }
export const isPublicMethodCollectionType = (valueType : PublicMethodValueType) : valueType is PublicMethodCollectionType =>
    !!valueType['collection']

export interface ModuleHistory {
    collections : {[name : string] : Array<CollectionDefinition>}
}