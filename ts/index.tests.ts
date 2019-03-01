import StorageManager from "@worldbrain/storex"
import { RegistryCollections } from "@worldbrain/storex/lib/registry"
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie"
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory"
import { StorageModule, registerModuleCollections } from ".";

export async function setupStorexTest<T extends {[name : string] : StorageModule}>(options : {
    collections : RegistryCollections,
    modules : {[name : string] : (options : {storageManager : StorageManager}) => StorageModule}
}) {
    const backend = new DexieStorageBackend({idbImplementation: inMemory(), dbName: 'unittest'})
    const storageManager = new StorageManager({backend: backend as any})
    storageManager.registry.registerCollections(options.collections)

    const modules : {[name : string] : StorageModule} = {}
    for (const [name, moduleCreator] of Object.entries(options.modules)) {
        const module = modules[name] = moduleCreator({storageManager})
        registerModuleCollections(storageManager.registry, module)
    }
    await storageManager.finishInitialization()
    return { storageManager, modules: modules as T }
}
