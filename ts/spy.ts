import { StorageModule } from ".";

export function installModuleSpy(mod : StorageModule) {
    for (const property in mod) {
        if (property !== 'operation' && property.substr(0, 1) !== '_') {
            const orig = mod[property] as any
            if (typeof orig !== 'function') {
                continue
            }

            mod[property as any] = (...args) => {
                const proxy = new Proxy(mod, {
                    get: (target, name) => {
                        if (name !== 'operation') {
                            return target[name]
                        }

                        return (operation : string, context) => {
                            return target['operation'](operation, context, property)
                        }
                    }
                })
                return orig.apply(proxy, args)
            }
        }
    }
}
