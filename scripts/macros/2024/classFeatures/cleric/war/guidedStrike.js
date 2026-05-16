import {activityUtils, constants, dialogUtils, genericUtils, itemUtils, thirdPartyUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger, workflow}) {
    if (!workflow.activity || workflow.isFumble || !workflow.targets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let feature = await thirdPartyUtils.attacked(workflow, 'guidedStrike', 'use', {distance: 30, attacker: true, dispositionType: 'enemy', dialogType: 'attackRoll'});
    if (!feature) return;
    let attackBonus = itemUtils.getConfig(feature, 'attackBonus');
    await workflowUtils.bonusAttack(workflow, String(attackBonus));
}
async function selfAttack({trigger: {entity: item}, workflow}) {
    if (!workflow.activity || workflow.isFumble || !workflow.targets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'selfUse', {strict: true});
    if (!activity) return;
    if (!activityUtils.canUse(activity)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Missed', {attackTotal: workflow.attackTotal, itemName: item.name}));
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token], {consumeResources: true, consumeUsage: true});
    let attackBonus = itemUtils.getConfig(item, 'attackBonus');
    await workflowUtils.bonusAttack(workflow, String(attackBonus));
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use', 'selfUse'], 'channelDivinity');
}
export let guidedStrike = {
    name: 'Guided Strike',
    version: '1.3.128',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'scenePostAttackRoll',
                macro: attack,
                priority: 200
            },
            {
                pass: 'postAttackRoll',
                macro: selfAttack,
                priority: 200 
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
    ],
    config: [
        {
            value: 'attackBonus',
            label: 'CHRISPREMADES.Config.AttackBonus',
            type: 'number',
            default: 10,
            category: 'homebrew',
            homebrew: true     
        }
    ]
};