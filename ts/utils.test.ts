import expect from 'expect'
import { StorageModuleCollections } from './'
import { mapCollectionVersions } from './utils'

const TEST_STORAGE_COLLECTIONS = (options: {
    withSecondCollection: boolean,
    withSecondCollectionHistory?: boolean
}): StorageModuleCollections => ({
    foo: {
        history: [
            {
                version: new Date('2019-01-01'),
                fields: {
                    spam: { type: 'text' },
                },
            },
            {
                version: new Date('2019-03-03'),
                fields: {
                    spam: { type: 'text' },
                    eggs: { type: 'text' },
                },
            },
        ],
        version: new Date('2019-05-05'),
        fields: {
            spam: { type: 'text' },
            eggs: { type: 'text' },
        },
    },
    ...(!options.withSecondCollection ? {} : {
        bar: {
            ...(!options.withSecondCollectionHistory ? {} : {
                history: [
                    {
                        version: new Date('2019-01-01'),
                        fields: {
                            something: { type: 'text' },
                        },
                    }
                ]
            }),
            version: new Date('2019-03-03'),
            fields: {
                something: { type: 'text' },
                other: { type: 'text' }
            },
        }
    })
})

describe('Collection version mapping', () => {
    it('should work', () => {
        const testCollections = TEST_STORAGE_COLLECTIONS({ withSecondCollection: false });
        expect(
            mapCollectionVersions({
                collectionDefinitions: testCollections,
                mappings: [
                    {
                        moduleVersion: new Date('2019-01-01'),
                        applicationVersion: new Date('2019-02-02'),
                    },
                    {
                        moduleVersion: new Date('2019-03-03'),
                        applicationVersion: new Date('2019-04-04'),
                    },
                    {
                        moduleVersion: new Date('2019-05-05'),
                        applicationVersion: new Date('2019-06-06'),
                    },
                ],
            }),
        ).toEqual({
            foo: {
                ...testCollections.foo,
                version: new Date('2019-06-06'),
                history: [
                    {
                        ...testCollections.foo.history![0],
                        version: new Date('2019-02-02'),
                    },
                    {
                        ...testCollections.foo.history![1],
                        version: new Date('2019-04-04'),
                    },
                ],
            }
        })
    })

    it('should ignore collection history from before the module was used in the application', () => {
        const testCollections = TEST_STORAGE_COLLECTIONS({ withSecondCollection: false });
        expect(
            mapCollectionVersions({
                collectionDefinitions: testCollections,
                mappings: [
                    {
                        moduleVersion: new Date('2019-03-03'),
                        applicationVersion: new Date('2019-04-04'),
                    },
                    {
                        moduleVersion: new Date('2019-05-05'),
                        applicationVersion: new Date('2019-06-06'),
                    },
                ],
            }),
        ).toEqual({
            foo: {
                ...testCollections.foo,
                version: new Date('2019-06-06'),
                history: [
                    {
                        ...testCollections.foo.history![1],
                        version: new Date('2019-04-04'),
                    },
                ],
            },
        })
    })

    it(`should pick the latest version of collections if they don't have versions after the minimal date`, () => {
        const testCollections = TEST_STORAGE_COLLECTIONS({ withSecondCollection: true });
        expect(
            mapCollectionVersions({
                collectionDefinitions: testCollections,
                mappings: [
                    {
                        moduleVersion: new Date('2019-05-05'),
                        applicationVersion: new Date('2019-06-06'),
                    },
                ],
            }),
        ).toEqual({
            foo: {
                ...testCollections.foo,
                version: new Date('2019-06-06'),
                history: [],
            },
            bar: {
                ...testCollections.bar,
                history: [],
                version: new Date('2019-06-06'),
            }
        })
    })

    it(`should pick only the latest version of collections if they don't have versions after the minimal date and there are multiple versions available`, () => {
        const testCollections = TEST_STORAGE_COLLECTIONS({ withSecondCollection: true, withSecondCollectionHistory: true });
        expect(
            mapCollectionVersions({
                collectionDefinitions: testCollections,
                mappings: [
                    {
                        moduleVersion: new Date('2019-05-05'),
                        applicationVersion: new Date('2019-06-06'),
                    },
                ],
            }),
        ).toEqual({
            foo: {
                ...testCollections.foo,
                version: new Date('2019-06-06'),
                history: [],
            },
            bar: {
                ...testCollections.bar,
                history: [],
                version: new Date('2019-06-06'),
            }
        })
    })
})
