import StorageManager, { PrimitiveFieldType, CollectionDefinition } from "@worldbrain/storex";

export type CreateObjectDefinition = {operation: 'createObject', collection : string}
export type MiscOperationDefinition = {operation : string, collection? : string, args: {[key : string]: any}}
export type StorageOperationDefinition = MiscOperationDefinition | CreateObjectDefinition
export type StorageOperationDefinitions = {[name : string] : StorageOperationDefinition}

export type StorageOperationExecuter = ({name, context, method, debug, render} : {name : string, context, method : string, debug? : boolean, render : () => any}) => Promise<any>
export type StorageModuleCollections = {[name : string] : CollectionDefinition & {history?: Array<CollectionDefinition>}}
export type StorageModuleConfig = {collections? : StorageModuleCollections, operations? : StorageOperationDefinitions, methods? : PublicMethodDefinitions}
export type StorageModuleConstructorArgs = {storageManager : StorageManager, operationExecuter? : StorageOperationExecuter}

export type PublicMethodDefinitions = {[name : string] : PublicMethodDefinition}
export interface PublicMethodDefinition {
    type : 'query' | 'mutation'
    args : PublicMethodArgs
    returns : PublicMethodValueType
}

export type PublicMethodArgs = {[name : string] : PublicMethodArg}
export type PublicMethodArg = PublicMethodValue<PublicMethodDetailedArg>
export type PublicMethodDetailedArg = PublicMethodDetailedValue & {positional? : true}

export type PublicMethodValue<Detailed = PublicMethodDetailedValue> = PublicMethodValueType | Detailed
export type PublicMethodDetailedValue = { type : PublicMethodValueType, optional? : boolean }
export const isDetailedPublicMethodValue = (arg : PublicMethodValue) : arg is PublicMethodDetailedValue => !!arg['type']
export const ensureDetailedPublicMethodValue = (arg : PublicMethodValue) : PublicMethodDetailedValue =>
    isDetailedPublicMethodValue(arg) ? arg : { type: arg }

export type PublicMethodValueType = PublicMethodScalarType | PublicMethodCollectionType | PublicMethodArrayType
export type PublicMethodScalarType = PrimitiveFieldType
export type PublicMethodArrayType = { array: PublicMethodValueType }
export const isPublicMethodArrayType = (valueType : PublicMethodValueType) : valueType is PublicMethodArrayType =>
    !!valueType['array']
export type PublicMethodCollectionType = { collection : string }
export const isPublicMethodCollectionType = (valueType : PublicMethodValueType) : valueType is PublicMethodCollectionType =>
    !!valueType['collection']
