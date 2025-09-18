import {constants, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function hit({trigger:{entity: item, token}, workflow}) {
    if (!constants.meleeAttacks.includes(workflowUtils.getActionType(workflow))) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'touchDamage');
    let range = config.range;
    if (range > 0 && tokenUtils.getDistance(token, workflow.token) > range) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.token]);
}
export let touchDamage = {
    name: 'Touch Damage',
    translation: 'CHRISPREMADES.Macros.TouchDamage.Name',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 5
        },
    ]
};