import {actorUtils, documentUtils, genericUtils} from '../../../../proxy.mjs';
const key = 'flags.chris-premades.pugilist.storedExhaustion';
function stored(effect) {
    return Number(effect.system.changes.find(change => change.key === key)?.value ?? 0);
}
function getDiggings(actor) {
    return actorUtils.getEffects(actor).filter(effect => documentUtils.getIdentifier(effect) === 'diggingDeep').sort((a, b) => stored(b) - stored(a));
}
async function setStored(effect, levels) {
    await documentUtils.update(effect, {'system.changes': [...effect.system.changes.filter(change => change.key !== key), {key, type: 'add', value: String(levels), priority: 20}]});
}
export function getStoredExhaustion(actor) {
    return getDiggings(actor).reduce((total, effect) => total + stored(effect), 0);
}
export async function addStoredExhaustion(actor, amount) {
    const [digging] = getDiggings(actor);
    if (!digging) return actorUtils.addExhaustion(actor, amount);
    await setStored(digging, Math.max(stored(digging) + amount, 0));
}
async function started({document: effect}) {
    const actor = effect.parent;
    const levels = actor?.system.attributes.exhaustion ?? 0;
    if (!levels) return;
    await documentUtils.update(actor, {'system.attributes.exhaustion': 0});
    await setStored(effect, levels);
}
async function ended({document: effect}) {
    const levels = stored(effect);
    const actor = effect.parent;
    if (!levels || !actor) return;
    const [other] = getDiggings(actor).filter(candidate => candidate.id !== effect.id);
    if (other) await setStored(other, stored(other) + levels);
    else await actorUtils.addExhaustion(actor, levels);
}
function preRestore({activity}) {
    if (activity.identifier !== 'exhaustion') return;
    const levels = (activity.actor.system.attributes.exhaustion ?? 0) + getStoredExhaustion(activity.actor);
    if (levels < 5) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.DigDeep.TooExhausted', {type: 'warn'});
    return true;
}
async function restore({workflow}) {
    if (workflow.activity.identifier === 'exhaustion') await addStoredExhaustion(workflow.actor, 1);
}
export const digDeepEffect = {
    name: 'Dig Deep: Digging Deep',
    version: '2.1.11',
    rules: '2024',
    effect: [
        {
            pass: 'created',
            macro: started,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: ended,
            priority: 50
        }
    ]
};
export const pugilistExhaustionRestore = {
    name: 'Pugilist: Exhaustion Restore',
    version: digDeepEffect.version,
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: preRestore,
            priority: 40
        },
        {
            pass: 'itemRollFinished',
            macro: restore,
            priority: 50
        }
    ]
};
