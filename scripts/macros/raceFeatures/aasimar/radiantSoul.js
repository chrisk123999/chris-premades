import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let pass = args[0].macroPass;
    if (workflow.hitTargets.size === 0) return;
    if (!(pass === 'postDamageRoll' || pass === 'preDamageApplication')) return;
    let effect = chris.findEffect(workflow.actor, 'Celestial Revelation (Radiant Soul)');
    if (!effect) effect = chris.findEffect(workflow.actor, 'Celestial Revelation (Radiant Consumption)');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let useFeature = chris.perTurnCheck(feature, 'feature', 'aasimarRadiantSoul', true, workflow.token.id);
    if (!useFeature) return;
    switch (pass) {
        case 'postDamageRoll':
            if (workflow.hitTargets.size != 1) return;
            let queueSetup = await queue.setup(workflow.item.uuid, 'aasimarRadiantSoul', 249);
            if (!queueSetup) return;
            let selected = await chris.dialog('Celestial Revelation: Add extra damage?', [['Yes', true], ['No', false]]);
            if (!selected) {
                queue.remove(workflow.item.uuid);
                return;
            }
            if (!(game.combat === null || game.combat === undefined)) await feature.setFlag('chris-premades', 'feature.aasimarRadiantSoul.turn', game.combat.round + '-' + game.combat.turn);
            let damageFormula = workflow.damageRoll._formula + ' + ' + workflow.actor.system.attributes.prof + '[radiant]';
            let damageRoll = await new Roll(damageFormula).roll({async: true});
            await workflow.setDamageRoll(damageRoll);
            queue.remove(workflow.item.uuid);
            return;
        case 'preDamageApplication':
            if (workflow.hitTargets.size <= 1) return;
            let queueSetup2 = queue.setup(workflow.item.uuid, 'aasimarRadiantSoul', 249);
            if (!queueSetup2) return;
            let buttons = [
                {
                    'label': 'Yes',
                    'value': true
                }, {
                    'label': 'No',
                    'value': false
                }
            ];
            let selection = await chris.selectTarget('Celestial Revelation: Add extra damage?', buttons, workflow.targets, false, 'one');
            if (selection.buttons === false) {
                queue.remove(workflow.item.uuid);
                return;
            }
            if (!(game.combat === null || game.combat === undefined)) await feature.setFlag('chris-premades', 'feature.aasimarRadiantSoul.turn', game.combat.round + '-' + game.combat.turn);
            let targetTokenID = selection.inputs.find(id => id != false);
            if (!targetTokenID) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let targetDamage = workflow.damageList.find(i => i.tokenId === targetTokenID);
            let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
            if (!targetActor) {
                queue.remove(workflow.item.uuid);
                return;
            }
            if (!(game.combat === null || game.combat === undefined)) await feature.setFlag('chris-premades', 'feature.aasimarRadiantSoul.turn', currentTurn);
            let hasDI = chris.checkTrait(targetActor, 'di', 'radiant');
            if (hasDI) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let damageTotal = workflow.actor.system.attributes.prof;
            let hasDR = chris.checkTrait(targetActor, 'dr', 'radiant');
            if (hasDR) damageTotal = Math.floor(damageTotal / 2);
            targetDamage.damageDetail[0].push(
                {
                    'damage': damageTotal,
                    'type': 'radiant'
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
    await origin.setFlag('chris-premades', 'feature.aasimarRadiantSoul.turn', false);
}
export let aasimarRadiantSoul = {
    'attack': attack,
    'turn': turn
}