import {actorUtils, automationUtils, dialogUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
let inUse = false;
function getReactors(token, excludeActorUuid, isSuccess, range) {
    return tokenUtils.findNearby(token, range, {disposition: 'all', includeIncapacitated: false}).reduce((accumulator, target) => {
        if (target.actor.uuid === excludeActorUuid) return accumulator;
        if (isSuccess && token.disposition === target.disposition) return accumulator;
        const feature = actorUtils.getItemByIdentifier(target.actor, 'chronal-shift');
        if (!feature || !feature.system.uses.value || actorUtils.hasUsedReaction(target.actor)) return accumulator;
        accumulator.push({target, feature});
        return accumulator;
    }, []);
}
async function selfRoll({document: item, roll}, rollType, abilityId) {
    if (inUse || !item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return;
    const targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    const selection = await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.ChronalShift.UseRollTotal', {itemName: item.name, rollTotal: roll.total}));
    if (!selection) return;
    const selfToken = actorUtils.getFirstToken(item.actor);
    await workflowUtils.syntheticItemRoll(item, selfToken ? [selfToken] : []);
    inUse = true;
    try {
        let newRoll;
        if (rollType === 'save') newRoll = (await item.actor.rollSavingThrow({ability: abilityId}, {}, {create: false}))?.[0];
        else if (rollType === 'check') newRoll = (await item.actor.rollAbilityCheck({ability: abilityId}, {}, {create: false}))?.[0];
        else if (rollType === 'skill') newRoll = (await item.actor.rollSkill({skill: abilityId}, {}, {create: false}))?.[0];
        return newRoll;
    } finally {
        inUse = false;
    }
}
async function selfSave(args) {return selfRoll(args, 'save', args.saveId);}
async function selfCheck(args) {return selfRoll(args, 'check', args.checkId);}
async function selfSkill(args) {return selfRoll(args, 'skill', args.skillId);}
async function thirdPartyRoll({document: item, actor: sourceActor, config, roll}, rollType) {
    if (inUse || !automationUtils.getConfigValue(item, 'enable3rdPartyReaction')) return;
    const token = actorUtils.getFirstToken(sourceActor);
    if (!token) return;
    const targetValue = roll.options.target;
    const isSuccess = targetValue && (roll.total >= targetValue);
    const reactors = getReactors(token, sourceActor.uuid, isSuccess, automationUtils.getConfigValue(item, 'range'));
    if (!reactors.length) return;
    let returnRoll;
    for (const {target, feature} of reactors) {
        if (returnRoll) continue;
        const userId = queryUtils.firstOwner(target.actor, true);
        const selection = await dialogUtils.queuedConfirmDialog(target.actor.name + ': ' + feature.name, _loc('CHRISPREMADES.Macros.Legacy.ChronalShift.UseRollTotalBy', {itemName: feature.name, rollTotal: roll.total, name: sourceActor.name}), {userId});
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(feature, [token], {userId});
        inUse = true;
        try {
            if (rollType === 'save') returnRoll = (await sourceActor.rollSavingThrow(config, {}, {create: false}))?.[0];
            else if (rollType === 'check') returnRoll = (await sourceActor.rollAbilityCheck(config, {}, {create: false}))?.[0];
            else if (rollType === 'skill') returnRoll = (await sourceActor.rollSkill(config, {}, {create: false}))?.[0];
        } finally {
            inUse = false;
        }
    }
    return returnRoll;
}
async function thirdPartySave(args) {return thirdPartyRoll(args, 'save');}
async function thirdPartyCheck(args) {return thirdPartyRoll(args, 'check');}
async function thirdPartySkill(args) {return thirdPartyRoll(args, 'skill');}
async function selfAttack({document: item, workflow}) {
    if (!workflow.attackRoll) return;
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return;
    const selection = await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.ChronalShift.UseRollTotal', {itemName: item.name, rollTotal: workflow.attackRoll.total}));
    if (!selection) return;
    const selfToken = actorUtils.getFirstToken(item.actor);
    await workflowUtils.syntheticItemRoll(item, selfToken ? [selfToken] : []);
    const [newRoll] = await workflow.activity.rollAttack({}, {}, {create: false});
    if (newRoll) await workflow.setAttackRoll(newRoll);
}
async function thirdPartyAttack({document: item, workflow}) {
    if (!workflow.attackRoll) return;
    if (!workflow.targets.count || !automationUtils.getConfigValue(item, 'enable3rdPartyReaction')) return;
    const token = workflow.token.document;
    const targetToken = workflow.targets.documents[0];
    const targetAC = targetToken.actor.system.attributes.ac.value;
    let isSuccess;
    if (workflow.isCritical) isSuccess = true;
    else if (workflow.isFumble) isSuccess = false;
    else isSuccess = workflow.attackRoll.total >= targetAC;
    const reactors = getReactors(token, workflow.actor.uuid, isSuccess, automationUtils.getConfigValue(item, 'range'));
    if (!reactors.length) return;
    for (const {target, feature} of reactors) {
        const userId = queryUtils.firstOwner(target.actor, true);
        const selection = await dialogUtils.queuedConfirmDialog(target.actor.name + ': ' + feature.name, _loc('CHRISPREMADES.Macros.Legacy.ChronalShift.UseRollTotalBy', {itemName: feature.name, rollTotal: workflow.attackRoll.total, name: token.name}), {userId});
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(feature, [token], {userId});
        const [newRoll] = await workflow.activity.rollAttack({}, {}, {create: false});
        if (newRoll) {
            await workflow.setAttackRoll(newRoll);
            break;
        }
    }
}
export const chronalShift = {
    name: 'Chronal Shift',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorAttackRoll', macro: selfAttack, priority: 800},
        {pass: 'sceneAttackRoll', macro: thirdPartyAttack, priority: 801}
    ],
    check: [
        {pass: 'sceneBonus', macro: thirdPartyCheck, priority: 50},
        {pass: 'actorBonus', macro: selfCheck, priority: 100}
    ],
    save: [
        {pass: 'sceneBonus', macro: thirdPartySave, priority: 50},
        {pass: 'actorBonus', macro: selfSave, priority: 100}
    ],
    skill: [
        {pass: 'sceneBonus', macro: thirdPartySkill, priority: 50},
        {pass: 'actorBonus', macro: selfSkill, priority: 100}
    ],
    config: {
        enable3rdPartyReaction: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.Enable3rdPartyReaction',
            category: 'mechanics'
        },
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
