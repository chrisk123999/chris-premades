import {dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let damageType = item.flags['chris-premades']?.terrorizingForce?.damageType ?? 'fire';
    let infernalMajestyEffect = effectUtils.getEffectByIdentifier(item.actor, 'infernalMajestyEffect');
    let formula = infernalMajestyEffect ? '2d8': '1d8';
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
}
async function use({trigger, workflow}) {
    let selection = await dialogUtils.selectDamageType(['cold', 'fire', 'necrotic', 'poison'], 'CHRISPREMADES.Generic.SelectDamageType', undefined);
    if (!selection) return;
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'terrorizingForce.damageType', selection);
}
export let terrorizingForce = {
    name: 'Terrorizing Force',
    version: '1.3.70',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};