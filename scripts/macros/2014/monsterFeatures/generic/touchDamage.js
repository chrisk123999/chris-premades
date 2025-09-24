import {constants, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function hit({trigger:{entity: item, token}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'touchDamage');
    let range = config.range;
    if (range > 0 && tokenUtils.getDistance(token, workflow.token) > range) return;
    if (item.system.uses.max && !item.system.uses.value) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.token], {consumeResources: true, consumeUsage: true});
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