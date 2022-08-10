import fromPairs from 'lodash/fromPairs'
import mapValues from 'lodash/mapValues'
import { CollectionDefinition } from '@worldbrain/storex'
import { StorageModuleCollections } from './'

export interface CollectionVersionMapEntry {
    moduleVersion: Date
    applicationVersion: Date
}
export function mapCollectionVersions(options: {
    collectionDefinitions: StorageModuleCollections
    mappings: Array<CollectionVersionMapEntry>
}) {
    const applicationVersions: {
        [moduleVersion: number]: CollectionVersionMapEntry
    } = fromPairs(
        options.mappings.map((mapping: CollectionVersionMapEntry) => [
            mapping.moduleVersion.getTime(),
            mapping,
        ]),
    )

    const minimalModuleVersion = options.mappings.reduce(
        (prev, curr) => Math.min(prev, curr.moduleVersion.getTime()),
        new Date('2100-01-01').getTime(),
    )
    const minimalApplicationVersion = applicationVersions[minimalModuleVersion].applicationVersion

    const collectionVersionTimestamp = (
        collectionDefinition: CollectionDefinition,
    ) => collectionDefinition.version.getTime()
    const mapCollectionVersion = (
        collectionName: string,
        collectionDefinition: CollectionDefinition,
        versionTimestamp: number,
        options: { optional: boolean }
    ) => {
        const mapping = applicationVersions[versionTimestamp]
        if (!mapping) {
            if (options.optional) {
                return null
            }
            throw new Error(
                `Could not map collection version of collection ` +
                collectionName +
                ` to application version: ` +
                collectionDefinition.version.toISOString(),
            )
        }

        return {
            ...collectionDefinition,
            version: mapping.applicationVersion,
        }
    }

    return mapValues(
        options.collectionDefinitions,
        (latestCollectionDefinition, collectionName) => {
            const oldHistory = latestCollectionDefinition.history || []
            const history = oldHistory
                .map(
                    (
                        pastCollectionDefinition: CollectionDefinition,
                    ): CollectionDefinition => {
                        const pastVersionTimestamp = collectionVersionTimestamp(
                            pastCollectionDefinition,
                        )
                        if (pastVersionTimestamp < minimalModuleVersion) {
                            return null
                        }

                        return mapCollectionVersion(
                            collectionName,
                            pastCollectionDefinition,
                            pastVersionTimestamp,
                            { optional: false }
                        )
                    },
                )
                .filter(entry => !!entry)

            const latestVersionTimestamp = collectionVersionTimestamp(
                latestCollectionDefinition,
            )
            let mapped = mapCollectionVersion(
                collectionName,
                latestCollectionDefinition,
                latestVersionTimestamp,
                { optional: !history.length }
            )
            if (!mapped) {
                mapped = {
                    ...latestCollectionDefinition,
                    version: new Date(minimalApplicationVersion)
                }
            }
            return {
                ...mapped,
                history,
            }
        },
    )
}
