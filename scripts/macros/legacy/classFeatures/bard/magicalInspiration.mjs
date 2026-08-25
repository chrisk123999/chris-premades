import {DamageBonus, dataUtils} from '../../../../proxy.mjs';
import {bardicInspiration} from '../../../all/classFeatures/bard/bardicInspiration.mjs';
async function modifyInspiration({data}) {
    const effect = data.effectData;
    if (!effect) return;
    return dataUtils.buildEffectData(effect, {macros: [{
        type: 'roll',
        macros: [{
            identifier: 'magicalInspirationEffect',
            rules: magicalInspiration.rules,
            source: 'chris-premades'
        }]
    }]});
}
async function damageHealing({document: effect, workflow}) {
    if (!workflow.activity.hasDamage && !workflow.activity.hasHealing) return;
    if (!workflow.hitTargets.size || workflow.item.type !== 'spell') return;
    const formula = effect.flags['chris-premades']?.bardicInspiration;
    if (!formula) return;
    return new DamageBonus(effect, {action: 'special', actor: effect.parent, formula, maxTargets: 1, allowCritical: false})
        .withOnUse(bardicInspiration.use)
        .initialize(workflow);
}
export const magicalInspiration = {
    name: 'Magical Inspiration',
    version: '2.0.2',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateBardicInspiration',
            macro: modifyInspiration,
            priority: 300
        }
    ]
};
export const magicalInspirationEffect = {
    name: magicalInspiration.name,
    version: magicalInspiration.version,
    rules: magicalInspiration.rules,
    roll: [ 
        {
            pass: 'actorOptionalBonusDamage',
            macro: damageHealing,
            priority: 300
        }
    ]
};
