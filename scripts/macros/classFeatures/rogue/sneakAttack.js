import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
async function attack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    if (!(this.item.system.actionType === 'rwak' || this.item.system.properties?.fin)) return;
    let effect = chris.findEffect(this.actor, 'Sneak Attack');
    if (!effect) return;
    let originFeature = await fromUuid(effect.origin);
    if (!originFeature) return;
    if (chris.inCombat()) {
        let turnCheck = chris.perTurnCheck(originFeature, 'feature', 'sneakAttack', false);
        if (!turnCheck) return;
    }
    let doSneak = false;
    let displayRakish = false;
    if (this.advantage) doSneak = true;
    let targetToken = this.targets.first();
    if (!doSneak && !this.disadvantage) {
        let nearbyTokens = await chris.findNearby(targetToken, 5, 'enemy').filter(t => t.id != this.token.id);
        if (nearbyTokens.length != 0) doSneak = true;
    }
    let rakishAudacity = this.actor.flags['chris-premades']?.feature?.rakishAudacity;
    if (rakishAudacity && !this.disadvantage && !doSneak && (chris.getDistance(this.token, targetToken) <= 5)) {
        let rNearbyTokens = await chris.findNearby(this.token, 5, 'all', true).filter(t => t.id != targetToken.id);
        if (rNearbyTokens.length === 0) {
            doSneak = true;
            displayRakish = true;
        }
    }
    if (!doSneak) return;
    let queueSetup = await queue.setup(this.item.uuid, 'sneakAttack', 215);
    if (!queueSetup) return;
    let autoSneak = this.actor.flags['chris-premades']?.feature?.sneakAttack?.auto;
    if (!autoSneak) {
        let selection = await chris.dialog('Use sneak attack?', [['Yes', true], ['No', false]]);
        if (!selection) {
            queue.remove(this.item.uuid);
            return;
        }
    }
    if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feature.sneakAttack.turn', game.combat.round + '-' + game.combat.turn);
    let bonusDamageFormula = this.actor.flags['chris-premades']?.feature?.sneakAttack?.customFormula;
    if (!bonusDamageFormula) {
        if (this.actor.type === 'character') {
            let scale = this.actor.system.scale?.rogue?.['sneak-attack'];
            if (scale) {
                let number = scale.number;
                if (this.isCritical) number = number * 2;
                bonusDamageFormula = number + 'd' + scale.faces + '[' + this.defaultDamageType + ']';
            } else {
                ui.notifications.warn('Actor does not appear to have a Sneak Attack scale!');
                queue.remove(this.item.uuid);
                return;
            }
        } else if (this.actor.type === 'npc') {
            let number = Math.ceil(this.actor.system.details.cr) / 2;
            if (this.isCritical) number = number * 2;
            bonusDamageFormula = number + 'd6[' + this.defaultDamageType + ']';
        }
    } else {
        bonusDamageFormula += '[' + this.defaultDamageType + ']';
    }
    let damageFormula = this.damageRoll._formula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    await originFeature.use();
    if (displayRakish) {
        let rEffect = chris.findEffect(this.actor, 'Rakish Audacity');
        if (rEffect) {
            let rFeature = await fromUuid(rEffect.origin);
            if (rFeature) await rFeature.use();
        }
    }
    queue.remove(this.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.sneakAttack.turn', '');
}
export let sneakAttack = {
    'attack': attack,
    'combatEnd': combatEnd
}