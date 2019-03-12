import StorageManager, { PrimitiveFieldType, CollectionDefinition } from "@worldbrain/storex";

export type CreateObjectDefinition = {operation: 'createObject', collection : string}
export type MiscOperationDefinition = {operation : string, collection? : string, args: {[key : string]: any}}
export type StorageOperationDefinition = MiscOperationDefinition | CreateObjectDefinition
export type StorageOperationDefinitions = {[name : string] : StorageOperationDefinition}

export type StorageOperationExecuter = ({name, context, method, debug, render} : {name : string, context, method : string, debug? : boolean, render : () => any}) => Promise<any>
export type StorageModuleCollections = {[name : string] : CollectionDefinition & {history?: Array<CollectionDefinition>}}
export type StorageModuleConfig = {collections? : StorageModuleCollections, operations? : StorageOperationDefinitions, methods?}
export type StorageModuleConstructorArgs = {storageManager : StorageManager, operationExecuter? : StorageOperationExecuter}

export type PublicMethodDefinitions = {[name : string] : PublicMethodDefinition}
export interface PublicMethodDefinition {
    args : PublicMethodArgs
    returns : PublicMethodValueType
}

export type PublicMethodArgs = {[name : string] : PublicMethodArg}
export type PublicMethodArg = PublicMethodValue
export type PublicMethodDetailedArg = PublicMethodDetailedValue

export type PublicMethodValue = PublicMethodValueType | PublicMethodDetailedValue
export type PublicMethodDetailedValue = { type : PublicMethodValueType, optional? : boolean }
export const isDetailedPublicMethodValue = (arg : PublicMethodArg) : arg is PublicMethodDetailedArg => !!arg['type']
export const ensureDetailedPublicMethodValue = (arg : PublicMethodArg) : PublicMethodDetailedArg =>
    isDetailedPublicMethodValue(arg) ? arg : { type: arg }

export type PublicMethodValueType = PublicMethodScalarType | PublicMethodCollectionType
export type PublicMethodScalarType = PrimitiveFieldType
export type PublicMethodCollectionType = { collection : string }
export const isPublicMethodCollectionType = (valueType : PublicMethodValueType) : valueType is PublicMethodCollectionType =>
    !!valueType['collection']
