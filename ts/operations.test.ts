import * as expect from 'expect'
import { renderOperationArgs } from './operations';

describe('Predefined operations', () => {
    it('should be able to render operation args with objects', () => {
        const operation = {displayName: '$displayName:string'}
        const rendered = renderOperationArgs(operation, {displayName: 'John Doe'})
        expect(rendered).toEqual({displayName: 'John Doe'})
    })

    it('should be able to render operation args with arrays', () => {
        const operation = [{displayName: '$displayName:string'}, {limit: '$limit:number', order: ['$order:string']}]
        const rendered = renderOperationArgs(operation, {limit: 10, order: 'displayName', displayName: 'John Doe'})
        expect(rendered).toEqual([{displayName: 'John Doe'}, {limit: 10, order: ['displayName']}])
    })
})