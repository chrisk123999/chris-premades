import {itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function targetLate({trigger: {entity: item, token}, workflow}) {
    let actor = item.actor;
    if (actor.system.attributes.hp.value) return;
    let ditem = workflow.damageList.find(i => i.actorUuid === actor.uuid);
    if (!ditem) return;
    if (!ditem.oldHP) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'deathBurst');
    let nearbyTargets = tokenUtils.findNearby(token, config.distance, 'all', {includeIncapacitated: true});
    if (!nearbyTargets.length) return;
    await workflowUtils.syntheticItemRoll(item, nearbyTargets);
}
export let deathBurst = {
    name: 'Death Burst',
    translation: 'CHRISPREMADES.Macros.DeathBurst.Name',
    version: '0.12.78',
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: targetLate,
                priority: 200
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'distance',
            label: 'CHRISPREMADES.Generic.Distance',
            type: 'number',
            default: 5
        }
    ]
};