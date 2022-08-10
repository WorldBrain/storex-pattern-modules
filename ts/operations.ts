import { UserLogic } from 'user-logic'
import { typedValueTemplate } from './user-logic'

const isPlainObject = require('lodash/isPlainObject')

export function renderOperationArgs(operation, vars, options?: { removeUndefinedValues?: boolean }) {
    if (isPlainObject(operation)) {
        const obj = {}
        for (const [k, v] of Object.entries(operation)) {
            const value = renderOperationArgs(v, vars, options)
            if (!options?.removeUndefinedValues || typeof value !== 'undefined') {
                obj[k] = value
            }
        }
        return obj
    } else if (operation instanceof Array) {
        return operation.map(elem => renderOperationArgs(elem, vars, options))
    } else if (typeof operation === 'string') {
        const logic = new UserLogic({ definition: operation, operations: { valueTemplate: typedValueTemplate } })
        return logic.evaluate(vars)
    } else {
        return operation
    }
}
