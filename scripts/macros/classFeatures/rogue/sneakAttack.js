import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!(workflow.item.system.actionType === 'rwak' || workflow.item.system.properties?.fin)) return;
    let effect = chris.findEffect(workflow.actor, 'Sneak Attack');
    if (!effect) return;
    let originFeature = await fromUuid(effect.origin);
    if (!originFeature) return;
    if (chris.inCombat()) {
        let turnCheck = chris.perTurnCheck(originFeature, 'feature', 'sneakAttack', false);
        if (!turnCheck) return;
    }
    let doSneak = false;
    let displayRakish = false;
    if (workflow.advantage) doSneak = true;
    let targetToken = workflow.targets.first();
    if (!doSneak && !workflow.disadvantage) {
        let nearbyTokens = await chris.findNearby(targetToken, 5, 'enemy').filter(t => t.id != workflow.token.id);
        if (nearbyTokens.length != 0) doSneak = true;
    }
    let rakishAudacity = workflow.actor.flags['chris-premades']?.feature?.rakishAudacity;
    if (rakishAudacity && !workflow.disadvantage && !doSneak && (chris.getDistance(workflow.token, targetToken) <= 5)) {
        let rNearbyTokens = await chris.findNearby(workflow.token, 5, 'all', true).filter(t => t.id != targetToken.id);
        if (rNearbyTokens.length === 0) {
            doSneak = true;
            displayRakish = true;
        }
    }
    if (!doSneak) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'sneakAttack', 215);
    if (!queueSetup) return;
    let autoSneak = workflow.actor.flags['chris-premades']?.feature?.sneakAttack?.auto;
    if (!autoSneak) {
        let selection = await chris.dialog('Use sneak attack?', [['Yes', true], ['No', false]]);
        if (!selection) {
            queue.remove(workflow.item.uuid);
            return;
        }
    }
    if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feature.sneakAttack.turn', game.combat.round + '-' + game.combat.turn);
    let bonusDamageFormula = workflow.actor.flags['chris-premades']?.feature?.sneakAttack?.customFormula;
    if (!bonusDamageFormula) {
        if (workflow.actor.type === 'character') {
            let scale = workflow.actor.system.scale?.rogue?.['sneak-attack'];
            if (scale) {
                let number = scale.number;
                bonusDamageFormula = number + 'd' + scale.faces + '[' + workflow.defaultDamageType + ']';
            } else {
                ui.notifications.warn('Actor does not appear to have a Sneak Attack scale!');
                queue.remove(workflow.item.uuid);
                return;
            }
        } else if (workflow.actor.type === 'npc') {
            let number = Math.ceil(workflow.actor.system.details.cr) / 2;
            bonusDamageFormula = number + 'd6[' + workflow.defaultDamageType + ']';
        }
    } else {
        bonusDamageFormula += '[' + workflow.defaultDamageType + ']';
    }
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    await originFeature.use();
    if (displayRakish) {
        let rEffect = chris.findEffect(workflow.actor, 'Rakish Audacity');
        if (rEffect) {
            let rFeature = await fromUuid(rEffect.origin);
            if (rFeature) await rFeature.use();
        }
    }
    queue.remove(workflow.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.sneakAttack.turn', '');
}
export let sneakAttack = {
    'attack': attack,
    'combatEnd': combatEnd
}