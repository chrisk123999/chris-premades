import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack(workflow, pass) {
    if (workflow.item.type != 'spell' || workflow.hitTargets.size === 0) return;
    if (!(pass === 'postDamageRoll' || pass === 'preDamageApplication')) return;
    let effect = chris.findEffect(workflow.actor, 'Radiant Soul');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let useFeature = chris.perTurnCheck(feature, 'feature', 'radiantSoul', false);
    if (!useFeature) return;
    switch (pass) {
        case 'postDamageRoll':
            if (workflow.hitTargets.size != 1) return;
            let queueSetup = await queue.setup(workflow.item.uuid, 'radiantSoul', 250);
            if (!queueSetup) return;
            let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
            if (!(damageTypes.has('fire') || damageTypes.has('radiant'))) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let selected = await chris.dialog('Radiant Soul: Add extra damage?', [['Radiant', 'radiant'], ['Fire', 'fire'], ['No', false]]);
            if (!selected) {
                queue.remove(workflow.item.uuid);
                return;
            }
            if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.radiantSoul.turn', game.combat.round + '-' + game.combat.turn);
            let damageFormula = workflow.damageRoll._formula + ' + ' + workflow.actor.system.abilities.cha.mod + '[' + selected + ']';
            let damageRoll = await new Roll(damageFormula).roll({async: true});
            await workflow.setDamageRoll(damageRoll);
            queue.remove(workflow.item.uuid);
            return;
        case 'preDamageApplication':
            if (workflow.hitTargets.size <= 1) return;
            let queueSetup2 = queue.setup(workflow.item.uuid, 'radiantSoul', 250);
            if (!queueSetup2) return;
            let damageTypes2 = chris.getRollDamageTypes(workflow.damageRoll);
            if (!(damageTypes2.has('fire') || damageTypes2.has('radiant'))) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let buttons = [
                {
                    'label': 'Yes',
                    'value': true
                }, {
                    'label': 'No',
                    'value': false
                }
            ];
            let selection = await chris.selectTarget('Radiant Soul: Add extra damage?', buttons, workflow.targets);
            if (selection.buttons === false) {
                queue.remove(workflow.item.uuid);
                return;
            }
            if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.radiantSoul.turn', game.combat.round + '-' + game.combat.turn);
            let targetTokenID = selection.inputs.find(id => id != false);
            if (!targetTokenID) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let targetDamage = workflow.damageList.find(i => i.tokenId === targetTokenID);
            let selected2 = await chris.dialog('Radiant Soul: What type of damage?', [['Radiant', 'radiant'], ['Fire', 'fire']]);
            if (!selected2) selected2 = 'radiant';
            let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
            if (!targetActor) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let hasDI = chris.checkTrait(targetActor, 'di', selected2);
            if (hasDI) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let damageTotal = workflow.actor.system.abilities.cha.mod;
            let hasDR = chris.checkTrait(targetActor, 'dr', selected2);
            if (hasDR) damageTotal = Math.floor(damageTotal / 2);
            targetDamage.damageDetail[0].push(
                {
                    'damage': damageTotal,
                    'type': selected2
                }
            );
            targetDamage.totalDamage += damageTotal;
            targetDamage.appliedDamage += damageTotal;
            targetDamage.hpDamage += damageTotal;
            if (targetDamage.oldTempHP > 0) {
                if (targetDamage.oldTempHP >= damageTotal) {
                    targetDamage.newTempHP -= damageTotal;
                } else {
                    let leftHP = damageTotal - targetDamage.oldTempHP;
                    targetDamage.newTempHP = 0;
                    targetDamage.newHP -= leftHP;
                }
            } else {
                targetDamage.newHP -= damageTotal;
            }
            queue.remove(workflow.item.uuid);
            return;
    }
}
async function turn (origin) {
    await origin.setFlag('chris-premades', 'feature.radiantSoul.turn', false);
}
export let radiantSoul = {
    'attack': attack,
    'turn': turn
}