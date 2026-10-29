import {effectUtils, genericUtils} from '../../../proxy.mjs';
async function ended({document: effect}) {
    const lethargy = effect.flags['chris-premades']?.haste?.lethargy;
    const actor = effectUtils.getActor(effect);
    if (!lethargy || !actor) return;
    const effectData = {
        name: _loc('CHRISPREMADES.Macros.All.Haste.Lethargic'),
        img: effect.img,
        origin: effect.origin,
        duration: {value: null, units: 'seconds', expiry: 'targetEnd'},
        statuses: lethargy === '2024' ? ['incapacitated'] : [],
        system: {
            changes: [{key: 'system.attributes.movement.multiplier', type: 'override', value: '0', phase: 'initial', priority: 50}]
        },
        flags: {
            cat: {
                identifier: 'hasteLethargy',
                macros: lethargy === '2024' ? {} : {roll: [{source: 'chris-premades', rules: 'all', identifier: 'haste-lethargy'}]}
            }
        }
    };
    await effectUtils.createEffects(actor, [effectData]);
}
function blockAction({activity}) {
    if (!['action', 'bonus'].includes(activity.activation?.type)) return;
    genericUtils.notify('CHRISPREMADES.Macros.All.Haste.NoActions', {type: 'warn'});
    return true;
}
export const hasteEffect = {
    name: 'Haste: Effect',
    version: '2.1.5',
    rules: 'all',
    effect: [
        {
            pass: 'deleted',
            macro: ended,
            priority: 50
        }
    ]
};
export const hasteLethargy = {
    name: 'Haste: Lethargic',
    version: hasteEffect.version,
    rules: hasteEffect.rules,
    roll: [
        {
            pass: 'actorPreTargeting',
            macro: blockAction,
            priority: 10
        }
    ]
};
