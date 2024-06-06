import {constants} from '../../constants.js';
import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size == 0 || !workflow.item) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.zephyrStrike?.advantage);
    if (!effect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'zephyrStrike', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '1d8[force]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    await effect.update({
        'flags.chris-premades.spell.zephyrStrike.advantage': false
    });
    queue.remove(workflow.item.uuid);
}
async function postAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType) || workflow.hitTargets.size != 0 || !workflow.item) return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.zephyrStrike?.advantage);
    if (!effect) return;
    await effect.update({
        'flags.chris-premades.spell.zephyrStrike.advantage': false
    })
}

async function preAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Zephyr Strike');
    if (!effect) return;
    if (effect.flags?.['chris-premades']?.spell?.zephyrStrike?.used) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let selection = await chris.dialog('Use Zephyr Strike?', constants.yesNo, 'Apply Zephyr Strike to gain advantage & extra damage?');
    if (!selection) return;
    let movementEffectData = {
        'icon': 'icons/skills/movement/feet-winged-boots-glowing-yellow.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 6
        },
        'name': 'Zephyr Strike - Movement',
        'changes': [
            {
                'key': "system.attributes.movement.walk",
                'mode': 2,
                'value': 30,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnEndSource'
                ]
            }
        }
    };
    await chris.createEffect(workflow.actor, movementEffectData);
    workflow.advantage = true;
    await effect.update({
        'flags.chris-premades.spell.zephyrStrike': {
            'used': true,
            'advantage': true
        }
    });
}

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.zephyrStrike.preAttack,preAttackRoll',
                'priority': 20
            }, {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.zephyrStrike.postAttack,postAttackRoll',
                'priority': 20
            }, {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.zephyrStrike.damage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'zephyrStrike': {
                        'used': false,
                        'advantage': false
                    }
                },
                'vae': {
                    'button': workflow.item.name
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData, workflow.item);
}

export let zephyrStrike = {
    'damage': damage,
    'preAttack': preAttack,
    'postAttack': postAttack,
    'item': item
};