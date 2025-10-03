import {activityUtils, dialogUtils, effectUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'rangedWeaponAttack')) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!activity) return;
    if (!activityUtils.canUse(activity)) return;
    let effects = effectUtils.getAllEffectsByIdentifier(workflow.hitTargets.first().actor, 'balefulInterdictEffect');
    if (!effects.length) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(activity, Array.from(workflow.hitTargets), {consumeResources: true, consumeUsage: true});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonImpalingShot = {
    name: 'Interdict Boons: Impaling Shot',
    aliases: ['Impaling Shot'],
    version: '1.3.76',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: attack,
                priority: 275
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};