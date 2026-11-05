import {actorUtils, documentUtils, effectUtils} from '../../../proxy.mjs';
async function toggle({workflow}) {
    if (workflow.activity.identifier !== 'fear-aura') return;
    const aura = actorUtils.getEffectByIdentifier(workflow.actor, 'orbOfDamaraAura');
    if (!aura) return;
    await documentUtils.deleteDocument(aura);
    return workflow.aborted = true;
}
async function fear({document: item, workflow}) {
    if (workflow.activity.identifier !== 'dragons-fear') return;
    const immunity = item.effects.find(effect => documentUtils.getIdentifier(effect) === 'orbOfDamaraImmune')?.toObject();
    if (!immunity) return;
    delete immunity._id;
    immunity.origin = item.uuid;
    immunity.duration = {value: 86400, units: 'seconds'};
    for (const target of workflow.targets) {
        if (!target.actor || workflow.failedSaves.has(target)) continue;
        await effectUtils.createEffects(target.actor, [immunity]);
    }
}
function notImmune({target}) {
    return !actorUtils.getEffectByIdentifier(target, 'orbOfDamaraImmune');
}
export const orbOfDamara = {
    name: 'Orb of Damara',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: toggle,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: fear,
            priority: 50
        }
    ]
};
export const orbOfDamaraImmunity = {
    name: 'Orb of Damara: Immunity',
    version: orbOfDamara.version,
    rules: orbOfDamara.rules,
    aura: [
        {
            pass: 'filter',
            macro: notImmune,
            priority: 50
        }
    ]
};
