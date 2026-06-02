function createProxy(targetPath) {
    const cache = new Map();
    return new Proxy({}, {
        get: function(target, prop) {
            if (prop === 'then' || typeof prop === 'symbol') return undefined;
            if (!game.modules.get('cat')?.active) return;
            if (cache.has(prop)) return cache.get(prop);
            let currentContext = globalThis.cat;
            if (!currentContext) throw new Error("globalThis.cat is not initialized yet. CAT isn't ready yet.");
            targetPath.forEach(function(pathPart) {
                if (currentContext) currentContext = currentContext[pathPart];
            });
            if (!currentContext || currentContext[prop] === undefined) {
                throw new Error('Property ' + String(prop) + ' does not exist on globalThis.cat.' + targetPath.join('.'));
            }
            const value = currentContext[prop];
            if (typeof value === 'object' && value !== null) {
                const childProxy = createProxy(targetPath.concat([prop]));
                cache.set(prop, childProxy);
                return childProxy;
            }
            if (typeof value === 'function') {
                const boundFunction = value.bind(currentContext);
                cache.set(prop, boundFunction);
                return boundFunction;
            }
            return value;
        }
    });
}
export const api = createProxy(['api']);
export const applications = createProxy(['applications']);
export const Crosshairs = createProxy(['lib', 'Crosshairs']);
export const Logging = createProxy(['lib', 'Logging']);
export const constants = createProxy(['lib', 'constants']);
export const activityUtils = createProxy(['utils', 'activityUtils']);
export const actorUtils = createProxy(['utils', 'actorUtils']);
export const automationUtils = createProxy(['utils', 'automationUtils']);
export const combatUtils = createProxy(['utils', 'combatUtils']);
export const crosshairUtils = createProxy(['utils', 'crosshairUtils']);
export const documentUtils = createProxy(['utils', 'documentUtils']);
export const effectUtils = createProxy(['utils', 'effectUtils']);
export const genericUtils = createProxy(['utils', 'genericUtils']);
export const itemUtils = createProxy(['utils', 'itemUtils']);
export const queryUtils = createProxy(['utils', 'queryUtils']);
export const regionUtils = createProxy(['utils', 'regionUtils']);
export const rollUtils = createProxy(['utils', 'rollUtils']);
export const sceneUtils = createProxy(['utils', 'sceneUtils']);
export const tokenUtils = createProxy(['utils', 'tokenUtils']);
export const uiUtils = createProxy(['utils', 'uiUtils']);
export const workflowUtils = createProxy(['utils', 'workflowUtils']);
export const animationUtils = createProxy(['utils', 'animationUtils']);
export const dialogUtils = createProxy(['utils', 'dialogUtils']);