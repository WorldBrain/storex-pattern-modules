import * as expect from 'expect'
import { UserLogic } from 'user-logic'
import { typedValueTemplate } from './user-logic';

describe('Custom user logic', () => {
    it('should parse typed strings', () => {
        const logic = new UserLogic({definition: '$foo:string', operations: {valueTemplate: typedValueTemplate}})
        expect(logic.evaluate({foo: 'bla'})).toEqual('bla')
    })
})
