import {actorUtils, combatUtils, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (['healing', 'temphp'].includes(workflow.defaultDamageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (!combatUtils.perTurnCheck(item, 'graspOfAvarice')) return;
    let targetToken = workflow.targets.first();
    if (tokenUtils.getDistance(workflow.token, targetToken) > 60) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'graspOfAvarice');
    let [damageFormula, damageType] = item.system.damage.parts[0];
    await workflowUtils.bonusDamage(workflow, damageFormula, {damageType});
    await workflowUtils.syntheticItemRoll(item.clone({'system.damage.parts': []}, {keepId: true}), [targetToken], {config: {consumeUsage: true}, options: {configureDialog: false}});
    let damageApplied = workflow.damageRolls.at(-1).total;
    damageApplied *= (MidiQOL.getTraitMult(targetToken.actor, damageType) ?? 1);
    damageApplied = Math.floor(damageApplied);
    if (damageApplied) await workflowUtils.applyDamage([workflow.token], damageApplied, 'healing');
}
async function damageApplication({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    if (['healing', 'temphp'].includes(workflow.defaultDamageType)) return;
    if (workflow.item.uuid === item.uuid) return;
    if (!item.system.uses.value) return;
    if (workflow.graspOfAvariceChoseNo) return;
    if (!combatUtils.perTurnCheck(item, 'graspOfAvarice')) return;
    let targetTokens = Array.from(workflow.hitTargets.filter(i => tokenUtils.getDistance(workflow.token, i) <= 60));
    if (!targetTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), targetTokens);
    workflow.graspOfAvariceChoseNo = true;
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'graspOfAvarice');
    let targetToken = selection[0];
    let ditem = workflow.damageList.find(i => i.actorUuid === targetToken.actor.uuid);
    if (!ditem) return;
    let [damageFormula, damageType] = item.system.damage.parts[0];
    let extraDamageRoll = await new CONFIG.Dice.DamageRoll(damageFormula, item.getRollData(), {type: damageType}).evaluate();
    extraDamageRoll.toMessage({
        flavor: item.name,
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token})
    });
    ditem.rawDamageDetail.push({
        value: extraDamageRoll.total,
        type: damageType
    });
    let multiplier = MidiQOL.getTraitMult(targetToken.actor, damageType) ?? 1;
    let damageApplied = Math.floor(extraDamageRoll.total * multiplier);
    ditem.damageDetail.push({
        value: damageApplied,
        type: damageType,
        active: {
            multiplier
        }
    });
    await workflowUtils.syntheticItemRoll(item.clone({'system.damage.parts': []}, {keepId: true}), [targetToken], {config: {consumeUsage: true}, options: {configureDialog: false}});
    if (damageApplied) await workflowUtils.applyDamage([workflow.token], damageApplied, 'healing');
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'graspOfAvarice', true);
}
export let graspOfAvarice = {
    name: 'Baleful Scion: Grasp of Avarice',
    version: '0.12.83',
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