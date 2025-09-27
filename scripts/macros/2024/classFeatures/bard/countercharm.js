import {activityUtils, actorUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function selfSave({trigger: {entity: item, config, actor, roll}}) {
    if (config['chris-premades']?.countercharm) return;
    if (actorUtils.hasUsedReaction(actor)) return;
    let targetValue = roll.options.target;
    if (!targetValue) return;
    if (roll.total >= targetValue) return;
    let activityUuid = config['chris-premades']?.activityUuid;
    if (!activityUuid) return;
    let activity = await fromUuid(activityUuid);
    if (!activity) return;
    let conditions = activityUtils.getConditions(activity);
    if (!conditions.size) return;
    let validConditions = itemUtils.getConfig(item, 'conditions');
    if (!conditions.find(i => validConditions.includes(i))) return;
    let token = actorUtils.getFirstToken(actor);
    if (!token) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.Countercharm.Use', {total: roll.total, feature: item.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [token]);
    genericUtils.setProperty(config, 'chris-premades.countercharm', true);
    genericUtils.setProperty(config, 'midiOptions.advantage', true);
    let returnRoll = (await actor.rollSavingThrow(config, undefined, {create: false}))?.[0];
    return returnRoll;
}
async function save({trigger: {config, sourceActor, roll}}) {
    if (config['chris-premades']?.countercharm) return;
    let targetValue = roll.options.target;
    if (!targetValue) return;
    if (roll.total >= targetValue) return;
    let activityUuid = config['chris-premades']?.activityUuid;
    if (!activityUuid) return;
    let activity = await fromUuid(activityUuid);
    if (!activity) return;
    let conditions = activityUtils.getConditions(activity);
    if (!conditions.size) return;
    let token = actorUtils.getFirstToken(sourceActor);
    if (!token) return;
    let validTokens = tokenUtils.findNearby(token, 30, 'ally', {includeIncapacitated: false}).filter(target => {
        let feature = itemUtils.getItemByIdentifier(target.actor, 'countercharm');
        if (!feature) return;
        if (actorUtils.hasUsedReaction(target.actor)) return;
        let validConditions = itemUtils.getConfig(feature, 'conditions');
        if (!conditions.find(i => validConditions.includes(i))) return;
        return true;
    });
    if (!validTokens.length) return;
    let returnRoll;
    for (let target of validTokens) {
        if (returnRoll) continue;
        let feature = itemUtils.getItemByIdentifier(target.actor, 'countercharm');
        let userId = socketUtils.firstOwner(target.actor, true);
        let selection = await dialogUtils.queuedConfirmDialog(target.actor.name + ': ' + feature.name, genericUtils.format('CHRISPREMADES.Macros.Countercharm.AllyFail', {name: sourceActor.name, total: roll.total, feature: feature.name}), {actor: target.actor, reason: 'reaction', userId});
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(feature, [token], {userId});
        genericUtils.setProperty(config, 'chris-premades.countercharm', true);
        genericUtils.setProperty(config, 'midiOptions.advantage', true);
        returnRoll = (await sourceActor.rollSavingThrow(config, undefined, {create: false}))?.[0];
    }
    return returnRoll;
}
export let countercharm = {
    name: 'Countercharm',
    version: '1.3.10',
    rules: 'modern',
    save: [
        {
            pass: 'sceneBonus',
            macro: save,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: selfSave,
            priority: 50
        }
    ],
    config: [
        {
            value: 'conditions',
            label: 'CHRISPREMADES.Config.Conditions',
            type: 'select-many',
            default: ['charmed', 'frightened'],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};