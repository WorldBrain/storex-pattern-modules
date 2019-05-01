import StorageManager, { StorageBackend } from "@worldbrain/storex"
import { RegistryCollections } from "@worldbrain/storex/lib/registry"
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie"
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory"
import { StorageModule, registerModuleCollections } from ".";

export async function setupStorexTest<T extends {[name : string] : StorageModule}>(options : {
    modules : {[name : string] : (options : {storageManager : StorageManager}) => StorageModule},
    collections? : RegistryCollections,
    dbName? : string,
    backend? : StorageBackend
}) {
    const backend = options.backend || new DexieStorageBackend({idbImplementation: inMemory(), dbName: options.dbName || 'unittest'})
    const storageManager = new StorageManager({backend: backend as any})
    if (options.collections) {
        storageManager.registry.registerCollections(options.collections)
    }

    const modules : {[name : string] : StorageModule} = {}
    for (const [name, moduleCreator] of Object.entries(options.modules)) {
        const module = modules[name] = moduleCreator({storageManager})
        registerModuleCollections(storageManager.registry, module)
    }
    await storageManager.finishInitialization()
    return { storageManager, modules: modules as T }
}
