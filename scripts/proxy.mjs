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
/** @type {typeof import('cat/scripts/api.mjs').default} */
export const api = createProxy(['api']);
/** @type {typeof import('cat/scripts/applications/_module.mjs')} */
export const applications = createProxy(['applications']);
/** @type {typeof import('cat/scripts/lib/_module.mjs').Crosshairs} */
export const Crosshairs = createProxy(['lib', 'Crosshairs']);
/** @type {typeof import('cat/scripts/lib/_module.mjs').Logging} */
export const Logging = createProxy(['lib', 'Logging']);
/** @type {typeof import('cat/scripts/lib/_module.mjs').constants} */
export const constants = createProxy(['lib', 'constants']);
/** @type {typeof import('cat/scripts/utilities/activityUtils.mjs').default} */
export const activityUtils = createProxy(['utils', 'activityUtils']);
/** @type {typeof import('cat/scripts/utilities/actorUtils.mjs').default} */
export const actorUtils = createProxy(['utils', 'actorUtils']);
/** @type {typeof import('cat/scripts/utilities/automationUtils.mjs').default} */
export const automationUtils = createProxy(['utils', 'automationUtils']);
/** @type {typeof import('cat/scripts/utilities/combatUtils.mjs').default} */
export const combatUtils = createProxy(['utils', 'combatUtils']);
/** @type {typeof import('cat/scripts/utilities/crosshairUtils.mjs').default} */
export const crosshairUtils = createProxy(['utils', 'crosshairUtils']);
/** @type {typeof import('cat/scripts/utilities/documentUtils.mjs').default} */
export const documentUtils = createProxy(['utils', 'documentUtils']);
/** @type {typeof import('cat/scripts/utilities/effectUtils.mjs').default} */
export const effectUtils = createProxy(['utils', 'effectUtils']);
/** @type {typeof import('cat/scripts/utilities/genericUtils.mjs').default} */
export const genericUtils = createProxy(['utils', 'genericUtils']);
/** @type {typeof import('cat/scripts/utilities/itemUtils.mjs').default} */
export const itemUtils = createProxy(['utils', 'itemUtils']);
/** @type {typeof import('cat/scripts/utilities/queryUtils.mjs').default} */
export const queryUtils = createProxy(['utils', 'queryUtils']);
/** @type {typeof import('cat/scripts/utilities/regionUtils.mjs').default} */
export const regionUtils = createProxy(['utils', 'regionUtils']);
/** @type {typeof import('cat/scripts/utilities/rollUtils.mjs').default} */
export const rollUtils = createProxy(['utils', 'rollUtils']);
/** @type {typeof import('cat/scripts/utilities/sceneUtils.mjs').default} */
export const sceneUtils = createProxy(['utils', 'sceneUtils']);
/** @type {typeof import('cat/scripts/utilities/tokenUtils.mjs').default} */
export const tokenUtils = createProxy(['utils', 'tokenUtils']);
/** @type {typeof import('cat/scripts/utilities/uiUtils.mjs').default} */
export const uiUtils = createProxy(['utils', 'uiUtils']);
/** @type {typeof import('cat/scripts/utilities/workflowUtils.mjs').default} */
export const workflowUtils = createProxy(['utils', 'workflowUtils']);
/** @type {typeof import('cat/scripts/utilities/animationUtils.mjs').default} */
export const animationUtils = createProxy(['utils', 'animationUtils']);
/** @type {typeof import('cat/scripts/utilities/dialogUtils.mjs').default} */
export const dialogUtils = createProxy(['utils', 'dialogUtils']);
/** @type {typeof import('cat/scripts/utilities/summonUtils.mjs').default} */
export const summonUtils = createProxy(['utils', 'summonUtils']);
/** @type {typeof import('cat/scripts/utilities/compendiumUtils.mjs').default} */
export const compendiumUtils = createProxy(['utils', 'compendiumUtils']);
/** @type {typeof import('cat/scripts/utilities/folderUtils.mjs').default} */
export const folderUtils = createProxy(['utils', 'folderUtils']);