import {combatUtils, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let damageType = workflow.defaultDamageType;
    if (['healing', 'temphp'].includes(damageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (!combatUtils.perTurnCheck(item, 'stasisStrike')) return;
    let targetToken = workflow.targets.first();
    if (tokenUtils.getDistance(workflow.token, targetToken) > 60) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'stasisStrike');
    await workflowUtils.bonusDamage(workflow, '1d8[force]', {damageType: 'force'});
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
}
async function damageApplication({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    let damageType = workflow.defaultDamageType;
    if (['healing', 'temphp'].includes(damageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (workflow.stasisStrikeChoseNo) return;
    if (!combatUtils.perTurnCheck(item, 'stasisStrike')) return;
    let targetTokens = Array.from(workflow.hitTargets.filter(i => tokenUtils.getDistance(workflow.token, i) <= 60));
    if (!targetTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), targetTokens);
    workflow.stasisStrikeChoseNo = true;
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'stasisStrike');
    let targetToken = selection[0];
    let ditem = workflow.damageList.find(i => i.actorUuid === targetToken.actor.uuid);
    if (!ditem) return;
    let extraDamageRoll = await new CONFIG.Dice.DamageRoll('1d8[force]', {}, {type: 'force'}).evaluate();
    extraDamageRoll.toMessage({
        flavor: item.name,
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token})
    });
    ditem.rawDamageDetail.push({
        value: extraDamageRoll.total,
        type: damageType
    });
    let multiplier = MidiQOL.getTraitMult(targetToken.actor, 'force') ?? 1;
    let damageApplied = Math.floor(extraDamageRoll.total * multiplier);
    ditem.damageDetail.push({
        value: damageApplied,
        type: damageType,
        active: {
            multiplier
        }
    });
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'stasisStrike', true);
}
export let stasisStrike = {
    name: 'Agent of Order: Stasis Strike',
    version: '1.0.36',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: damageApplication,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};