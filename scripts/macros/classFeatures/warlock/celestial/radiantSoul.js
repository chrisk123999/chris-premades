import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let pass = args[0].macroPass;
    if (workflow.item.type != 'spell' || workflow.hitTargets.size === 0) return;
    if (!(pass === 'postDamageRoll' || pass === 'preDamageApplication')) return;
    let feature = chris.getItem(workflow.actor, 'Radiant Soul');
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
            let options = [];
            if (damageTypes.has('fire')) options.push(['Yes (Fire)', 'fire']);
            if (damageTypes.has('radiant')) options.push(['Yes (Radiant)', 'radiant']);
            options.push(['No', false]);
            let selected = await chris.dialog('Radiant Soul', options, 'Radiant Soul: Add extra damage?');
            if (!selected) {
                queue.remove(workflow.item.uuid);
                return;
            }
            if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.radiantSoul.turn', game.combat.round + '-' + game.combat.turn);
            let bonusDamageFormula = workflow.actor.system.abilities.cha.mod + '[' + selected + ']';
            await chris.addToDamageRoll(workflow, bonusDamageFormula);
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
            let selection = await chris.selectTarget('Radiant Soul: Add extra damage?', constants.yesNo, workflow.targets, false, 'one');
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
            let options2 = [];
            if (damageTypes2.has('fire')) options2.push(['Yes (Fire)', 'fire']);
            if (damageTypes2.has('radiant')) options2.push(['Yes (Radiant)', 'radiant']);
            let selected2;
            if (options2.length === 2) {
                selected2 = await chris.dialog('Radiant Soul', options2, 'What damage type?');
            } else if (damageTypes2.has('fire')) {
                selected2 = 'fire';
            } else {
                selected2 = 'radiant';
            }
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
async function turn(origin) {
    await origin.setFlag('chris-premades', 'feature.radiantSoul.turn', false);
}
export let radiantSoul = {
    'attack': attack,
    'turn': turn
}