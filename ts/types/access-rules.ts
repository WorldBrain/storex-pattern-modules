export interface AccessRules {
    ownership? : OwnershipRules
    permissions? : PermissionRules
    validation? : ValidationRules
    constraints? : ConstraintRules
}

export type AccessType = 'list' | 'read' | 'create' | 'update' | 'delete'

export type OwnershipRules = {[collection : string] : OwnershipRule}
export interface OwnershipRule {
    field : string
    access : 'full' | AccessType[]
}

export type PermissionRules = {[collection : string] : PermissionAccessTypeRules}
export type PermissionAccessTypeRules = { [Type in AccessType]?: PermissionRule }
export interface PermissionRule {
    group? : string
    prepare? : RulePreparation[]
    rule : RuleLogic
}

export type ValidationRules = {[collection : string] : ValidationRule[]}
export interface ValidationRule {
    field : string
    rule : RuleLogic
}

export type ConstraintRules = ConstraintRule[]
export interface ConstraintRule {
    prepare? : RulePreparation[]
    rule : RuleLogic
}

export type RulePreparation = FindObjectPermissionPreparation | CountObjectsPermissionPreparation
export interface BasePermissionPreparation {
    placeholder : string
}
export interface FindObjectPermissionPreparation extends BasePermissionPreparation {
    operation : 'findObject',
    collection : string,
    where: {[key : string] : any}
}
export interface CountObjectsPermissionPreparation extends BasePermissionPreparation {
    operation : 'countObjects',
    collection : string,
    where: {[key : string] : any}
}

export type RuleLogic = RuleLogicValue | RuleLogicBinaryOp | RuleLogicExists | RuleLogicNot
export interface RuleLogicArray extends Array<RuleLogic> {}
export type RuleLogicValue = string | number | null
export type RuleLogicBinaryOpKey = 'or' | 'and' | 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le'
export type RuleLogicBinaryOp = { [OpKey in RuleLogicBinaryOpKey]? : RuleLogicArray}
export type RuleLogicExists = { exists : string }
export type RuleLogicNot = { not : RuleLogic }
