import {actorUtils, automationUtils, constants, effectUtils, tokenUtils} from '../../../proxy.mjs';
function isAffected(ignored, token) {
    if (!token.actor || ['dead', 'unconscious'].some(status => token.actor.statuses.has(status))) return false;
    return !ignored.includes(actorUtils.typeOrRace(token.actor));
}
function ignoredTypes(effect) {
    return automationUtils.getOriginConfigValue(effect, 'ignoredCreatureTypes') ?? [];
}
async function moved({document: effect, token}) {
    const ignored = ignoredTypes(effect);
    if (!tokenUtils.findNearby(token, 10).some(other => isAffected(ignored, other))) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (item) await effectUtils.endConcentration(effect.parent, item);
}
async function nearbyMoved({document: effect, token, action}) {
    const casterToken = actorUtils.getFirstToken(effect.parent);
    if (action === 'catForce' || !casterToken || token === casterToken) return;
    const distance = tokenUtils.getDistance(casterToken, token);
    if (distance <= 10 && isAffected(ignoredTypes(effect), token)) await tokenUtils.slideToken(token, {sourceToken: casterToken, distance: 15 - distance});
}
export const antilifeShell = {
    name: 'Antilife Shell',
    version: '2.1.3',
    rules: '2024',
    move: [
        {pass: 'actorMoved', macro: moved, priority: 50},
        {pass: 'nearbyMoved', macro: nearbyMoved, priority: 50}
    ],
    config: {
        ignoredCreatureTypes: {
            default: ['undead', 'construct'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.IgnoredCreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        }
    }
};
