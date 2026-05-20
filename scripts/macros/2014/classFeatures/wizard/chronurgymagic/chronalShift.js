import {actorUtils, dialogUtils, genericUtils, itemUtils, workflowUtils, tokenUtils, socketUtils} from '../../../../../utils.js';
let inUse = false;
async function selfRoll({trigger: {entity: item, roll}}, rollType, abilityId) {
    if (inUse || !item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return; 
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name, rollTotal: roll.total}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true});
    inUse = true;
    try {
        let newRoll;
        if (rollType === 'save') {
            newRoll = (await item.actor.rollSavingThrow({ability: abilityId}, undefined, {create: false}))?.[0];
        } else if (rollType === 'check') {
            newRoll = (await item.actor.rollAbilityTest({ability: abilityId}, undefined, {create: false}))?.[0];
        } else if (rollType === 'skill') {
            newRoll = (await item.actor.rollSkill({skill: abilityId}, undefined, {create: false}))?.[0];
        }
        return newRoll;
    } finally {
        inUse = false;
    }
}
async function selfSave(args) {return selfRoll(args, 'save', args.trigger.saveId);}
async function selfCheck(args) {return selfRoll(args, 'check', args.trigger.checkId);}
async function selfSkill(args) {return selfRoll(args, 'skill', args.trigger.skillId);}
async function thirdPartyRoll({trigger: {entity: item, config, sourceActor, roll}}, rollType) {
    if (inUse || !itemUtils.getConfig(item, 'enable3rdPartyReaction')) return;
    let token = actorUtils.getFirstToken(sourceActor);
    if (!token) return;
    let targetValue = roll.options.target;
    let isSuccess = targetValue && (roll.total >= targetValue);
    let validTokens = tokenUtils.findNearby(token, 30, 'all', {includeIncapacitated: false}).filter(target => {
        if (target.actor.uuid === sourceActor.uuid) return false;
        let tokenDisposition = token.document.disposition;
        let targetDisposition = target.document.disposition;
        if (isSuccess && tokenDisposition === targetDisposition) return false;
        let feature = itemUtils.getItemByIdentifier(target.actor, 'chronalShift');
        if (!feature || !feature.system.uses.value || actorUtils.hasUsedReaction(target.actor)) return false;
        return true;
    });
    if (!validTokens.length) return;
    let returnRoll;
    for (let target of validTokens) {
        if (returnRoll) continue;
        let feature = itemUtils.getItemByIdentifier(target.actor, 'chronalShift');
        let userId = socketUtils.firstOwner(target.actor, true);
        let selection = await dialogUtils.queuedConfirmDialog(
            target.actor.name + ': ' + feature.name, 
            genericUtils.format('CHRISPREMADES.Dialog.UseRollTotalBy', {itemName: feature.name, rollTotal: roll.total, name: sourceActor.name}), 
            {actor: target.actor, reason: 'reaction', userId}
        );
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(feature, [token], {userId, consumeUsage: true, consumeResources: true});
        inUse = true;
        try {
            if (rollType === 'save') {
                returnRoll = (await sourceActor.rollSavingThrow(config, undefined, {create: false}))?.[0];
            } else if (rollType === 'check') {
                returnRoll = (await sourceActor.rollAbilityTest(config, undefined, {create: false}))?.[0];
            } else if (rollType === 'skill') {
                returnRoll = (await sourceActor.rollSkill(config, undefined, {create: false}))?.[0];
            }
        } finally {
            inUse = false;
        }
    }
    return returnRoll;
}
async function thirdPartySave(args) {return thirdPartyRoll(args, 'save');}
async function thirdPartyCheck(args) {return thirdPartyRoll(args, 'check');}
async function thirdPartySkill(args) {return thirdPartyRoll(args, 'skill');}
async function selfAttack({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return; 
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name, rollTotal: workflow.attackRoll.total}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true});
    let [newRoll] = await workflow.activity.rollAttack({}, undefined, {create: false});
    if (newRoll) await workflow.setAttackRoll(newRoll);
}
async function thirdPartyAttack({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !itemUtils.getConfig(item, 'enable3rdPartyReaction')) return;
    let token = workflow.token;
    let targetToken = workflow.targets.first();
    let targetAC = targetToken.actor.system.attributes.ac.value;
    let isSuccess;
    if (workflow.isCritical) {
        isSuccess = true;
    } else if (workflow.isFumble) {
        isSuccess = false;
    } else {
        isSuccess = workflow.attackRoll.total >= targetAC;
    }
    let validTokens = tokenUtils.findNearby(token, 30, 'all', {includeIncapacitated: false}).filter(target => {
        if (target.actor.uuid === item.actor.uuid) return false;
        let tokenDisposition = token.document.disposition;
        let targetDisposition = target.document.disposition;
        if (isSuccess && tokenDisposition === targetDisposition) return false;
        let feature = itemUtils.getItemByIdentifier(target.actor, 'chronalShift');
        if (!feature || !feature.system.uses.value || actorUtils.hasUsedReaction(target.actor)) return false;
        return true;
    });
    if (!validTokens.length) return;
    for (let target of validTokens) {
        let feature = itemUtils.getItemByIdentifier(target.actor, 'chronalShift');
        let userId = socketUtils.firstOwner(target.actor, true);
        let selection = await dialogUtils.queuedConfirmDialog(
            target.actor.name + ': ' + feature.name, 
            genericUtils.format('CHRISPREMADES.Dialog.UseRollTotalBy', {itemName: feature.name, rollTotal: workflow.attackRoll.total, name: token.name}), 
            {actor: target.actor, reason: 'reaction', userId}
        );
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(feature, [token], {userId, consumeUsage: true, consumeResources: true});
        let [newRoll] = await workflow.activity.rollAttack({}, undefined, {create: false});
        if (newRoll) {
            await workflow.setAttackRoll(newRoll);
            break; 
        }
    }
}
export let chronalShift = {
    name: 'Chronal Shift',
    version: '1.5.32',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: selfAttack,
                priority: 800
            },
            {
                pass: 'scenePostAttackRoll',
                macro: thirdPartyAttack,
                priority: 801
            }
        ]
    },
    check: [
        {
            pass: 'sceneBonus',
            macro: thirdPartyCheck,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: selfCheck,
            priority: 100
        }
    ],
    save: [
        {
            pass: 'sceneBonus',
            macro: thirdPartySave,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: selfSave,
            priority: 100
        }
    ],
    skill: [
        {
            pass: 'sceneBonus',
            macro: thirdPartySkill,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: selfSkill,
            priority: 100
        }
    ],
    config: [
        {
            value: 'enable3rdPartyReaction',
            label: 'CHRISPREMADES.Config.Enable3rdPartyReaction',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ]
};