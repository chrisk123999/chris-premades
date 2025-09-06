import {activityUtils, constants, dialogUtils, genericUtils, itemUtils, thirdPartyUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger, workflow}) {
    if (!workflow.activity || workflow.isFumble || !workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let feature = await thirdPartyUtils.attacked(workflow, 'guidedStrike', 'use', {distance: 30, attacker: true, dispositionType: 'enemy', dialogType: 'attackRoll'});
    if (!feature) return;
    let attackBonus = itemUtils.getConfig(feature, 'attackBonus');
    await workflowUtils.bonusAttack(workflow, String(attackBonus));
}
async function selfAttack({trigger: {entity: item}, workflow}) {
    if (!workflow.activity || workflow.isFumble || !workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
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
async function added({trigger: {entity: item, actor}}) {
    let channelDivinity = itemUtils.getItemByIdentifier(actor, 'channelDivinity');
    if (!channelDivinity) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!activity) return;
    let selfActivity = activityUtils.getActivityByIdentifier(item, 'selfUse', {strict: true});
    if (!selfActivity) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activity.id].consumption.targets[0].target = channelDivinity.id;
    itemData.system.activities[selfActivity.id].consumption.targets[0].target = channelDivinity.id;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    let selfPath = 'system.activities.' + selfActivity.id + '.consumption.targets';
    await genericUtils.update(item, {
        [path]: itemData.system.activities[activity.id].consumption.targets,
        [selfPath]: itemData.system.activities[selfActivity.id].consumption.targets
    });
}
export let guidedStrike = {
    name: 'Guided Strike',
    version: '1.3.43',
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