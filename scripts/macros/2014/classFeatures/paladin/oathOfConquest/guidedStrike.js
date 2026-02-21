import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!itemUtils.canUse(item)) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.GuidedStrike.Attack', {attackRoll: workflow.attackRoll.total, item: item.name}));
    if (!selection) return;
    await workflowUtils.bonusAttack(workflow, '10');
    await workflowUtils.syntheticItemRoll(item, Array.from(workflow.targets), {consumeResources: true, consumeUsage: true});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'channelDivinity');
}
export let guidedStrike = {
    name: 'Guided Strike',
    version: '1.5.1',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 100
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ]
};