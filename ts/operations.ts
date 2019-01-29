import * as isPlainObject from 'lodash/isPlainObject'
import { UserLogic } from 'user-logic'
import { typedValueTemplate } from './user-logic'

export function renderOperationArgs(operation, vars) {
    if (isPlainObject(operation)) {
        const obj = {}
        for (const [k, v] of Object.entries(operation)) {
            obj[k] = renderOperationArgs(v, vars)
        }
        return obj
    } else if (operation instanceof Array) {
        return operation.map(elem => renderOperationArgs(elem, vars))
    } else if (typeof operation === 'string') {
        const logic = new UserLogic({definition: operation, operations: {valueTemplate: typedValueTemplate}})
        return logic.evaluate(vars)
    } else {
        return operation
    }
}
