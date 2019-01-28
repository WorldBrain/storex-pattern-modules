import * as expect from 'expect'
import { renderOperationArgs } from './operations';

describe('Predefined operations', () => {
    it('should be able to render operations with objects', () => {
        const operation = {displayName: '$displayName:string'}
        const rendered = renderOperationArgs(operation, {displayName: 'John Doe'})
        expect(rendered).toEqual({displayName: 'John Doe'})
    })
})