import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {translate} from '../../../../translations.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let max = Math.max(workflow.actor.system.abilities.con.mod, 1);
    if (workflow.targets.size > max) {
        let buttons = [
            {
                'label': 'Ok',
                'value': true
            }, {
                'label': 'Cancel',
                'value': false
            }
        ];
        let selection = await chris.selectTarget(workflow.item.name, buttons, Array.from(workflow.targets), false, 'multiple');
        if (!selection.buttons) return;
        let newTargets = selection.inputs.filter(i => i);
        if (newTargets.length > max) {
            ui.notifications.info('Too many targets selected!');
            chris.updateTargets([]);
            return;
        }
        chris.updateTargets(newTargets);
    }
}
async function late({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let damageRoll = await new Roll(workflow.targets.size * 5 + '[temphp]').roll({'async': true});
    await chris.applyWorkflowDamage(workflow.token, damageRoll, 'temphp', [workflow.token], workflow.item.name, workflow.itemCardId);
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    let updates = {
        'flags': {
            'chris-premades': {
                'feature': {
                    'callTheHunt': {
                        'tokens': Array.from(workflow.targets).map(i => i.document.uuid)
                    }
                }
            }
        }
    };
    await chris.updateEffect(effect, updates);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.token) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.actor, 'Call the Hunt');
    if (!effect) return;
    let turnCheck = chris.perTurnCheck(effect, 'feature', 'callTheHunt', true, workflow.token.id);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'callTheHuntAttack', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog('Call the Hunt', constants.yesNo, 'Apply Call the Hunt bonus damage?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (chris.inCombat()) {
        let updates = {
            'flags': {
                'chris-premades': {
                    'feature': {
                        'callTheHunt': {
                            'turn': game.combat.round + '-' + game.combat.turn
                        }
                    }
                }
            }
        };
        await chris.updateEffect(effect, updates);
    }
    let defaultDamageType = workflow.defaultDamageType;
    let bonusDamageFormula = '1d8[' + defaultDamageType + ']';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    queue.remove(workflow.item.uuid);
}
async function rageEnd(effect) {
    let tokens = effect.flags['chris-premades']?.feature?.callTheHunt?.tokens;
    if (!tokens) return;
    for (let i of tokens) {
        let targetToken = await fromUuid(i);
        if (!targetToken) continue;
        let effect2 = chris.findEffect(targetToken.actor, 'Call the Hunt');
        if (!effect2) continue;
        await chris.removeEffect(effect2);
    }
}
async function combatEnd(effect) {
    await effect.setFlag('chris-premades', 'feature.callTheHunt.turn', '');
}
export let callTheHunt = {
    'item': item,
    'late': late,
    'attack': attack,
    'rageEnd': rageEnd,
    'combatEnd': combatEnd
}