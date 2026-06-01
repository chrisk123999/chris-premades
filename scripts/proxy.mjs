function createProxy(targetPath) {
    return new Proxy({}, {
        get: function(target, prop) {
            if (prop === 'then' || typeof prop === 'symbol') {
                return undefined;
            }
            const cat = game.modules.get('cat');
            if (!cat?.active) return;
            let currentContext = globalThis.cat;
            if (!currentContext) {
                throw new Error('globalThis.cat is not initialized yet. CAT isn\'t ready yet.');
            }
            targetPath.forEach(function(pathPart) {
                if (currentContext) {
                    currentContext = currentContext[pathPart];
                }
            });
            if (!currentContext || currentContext[prop] === undefined) {
                throw new Error('Property ' + String(prop) + ' does not exist on globalThis.cat.' + targetPath.join('.'));
            }
            const value = currentContext[prop];
            if (typeof value === 'object' && value !== null) {
                return createProxy(targetPath.concat([prop]));
            }
            if (typeof value === 'function') {
                return value.bind(currentContext);
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