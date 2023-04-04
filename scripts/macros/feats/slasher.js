import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function slow({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || !this.damageRoll || !['mwak', 'rwak', 'msak', 'rsak'].includes(this.item.system.actionType)) return;
    let effect = chris.findEffect(this.actor, 'Slasher: Reduce Speed');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let doExtraDamage = chris.perTurnCheck(originItem, 'feat', 'slasher', false, this.token.id);
    if (!doExtraDamage) return;
    let queueSetup = await queue.setup(this.item.uuid, 'slasherSlow', 250);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(this.damageRoll);
    if (!damageTypes.has('slashing')) {
        queue.remove(this.item.uuid);
        return;
    }
    let autoSlasher = this.actor.flags['chris-premades']?.feat?.slasher?.auto;
    if (!autoSlasher) {
        let selection = await chris.dialog('Slasher: Slow target?', [['Yes', true], ['No', false]]);
        if (!selection) {
            queue.remove(this.item.uuid);
            return;
        }
    }
    if (chris.inCombat()) await originItem.setFlag('chris-premades', 'feat.slasher.turn', game.combat.round + '-' + game.combat.turn);
    let effectData = {
        'label': originItem.name,
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 12
        },
        'changes': [
            {
                'key': 'system.attributes.movement.all',
                'mode': 0,
                'value': '-10',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(this.targets.first().actor, effectData);
    queue.remove(this.item.uuid);
}
async function critical({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || !this.isCritical || !this.damageRoll) return;
    let effect = chris.findEffect(this.actor, 'Slasher: Critical Hit');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let queueSetup = await queue.setup(this.item.uuid, 'slasherCritical', 251);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(this.damageRoll);
    if (!damageTypes.has('slashing')) {
        queue.remove(this.item.uuid);
        return;
    }
    let effectData = {
        'label': originItem.name,
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 12
        },
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.attack.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(this.targets.first().actor, effectData);
    queue.remove(this.item.uuid);
}
export let slasher = {
    'slow': slow,
    'critical': critical
}