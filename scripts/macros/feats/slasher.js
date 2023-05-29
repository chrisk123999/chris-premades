import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function slow({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.damageRoll || !['mwak', 'rwak', 'msak', 'rsak'].includes(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.actor, 'Slasher: Reduce Speed');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let doExtraDamage = chris.perTurnCheck(originItem, 'feat', 'slasher', false, workflow.token.id);
    if (!doExtraDamage) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'slasherSlow', 250);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!damageTypes.has('slashing')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let autoSlasher = workflow.actor.flags['chris-premades']?.feat?.slasher?.auto;
    if (!autoSlasher) {
        let selection = await chris.dialog('Slasher: Slow target?', [['Yes', true], ['No', false]]);
        if (!selection) {
            queue.remove(workflow.item.uuid);
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
    await chris.createEffect(workflow.targets.first().actor, effectData);
    queue.remove(workflow.item.uuid);
}
async function critical({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.isCritical || !workflow.damageRoll) return;
    let effect = chris.findEffect(workflow.actor, 'Slasher: Critical Hit');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'slasherCritical', 251);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!damageTypes.has('slashing')) {
        queue.remove(workflow.item.uuid);
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
    await chris.createEffect(workflow.targets.first().actor, effectData);
    queue.remove(workflow.item.uuid);
}
export let slasher = {
    'slow': slow,
    'critical': critical
}