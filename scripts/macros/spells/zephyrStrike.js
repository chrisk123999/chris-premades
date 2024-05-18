import {constants} from '../../constants.js';
import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    console.log("damage");
    if (workflow.hitTargets.size == 0 || !workflow.item) return;
    console.log(workflow);
    console.log(workflow.item.system.actionType);
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    console.log(workflow.item.system.actionType);
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.zephyrStrikeAdvantage);
    console.log(effect);
    if (!effect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'zephyrStrike', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '1d8[force]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);

    await chris.removeEffect(effect);
    queue.remove(workflow.item.uuid);
}
async function postAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    console.log("postAttack")
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType) || workflow.hitTargets.size != 0 || !workflow.item) return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.zephyrStrikeAdvantage);
    await chris.removeEffect(effect);
}

async function buff({speaker, actor, token, character, item, args, scope, workflow}) {
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

    let advantageEffectData = {
        'icon': 'icons/skills/targeting/crosshair-pointed-orange.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'turns': 1
        },
        'name': 'Zephyr Strike - Advantage',
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.zephyrStrike.postAttack,postAttackRoll',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.zephyrStrike.damage,postDamageRoll',
                'priority': 20
            },
            {
                'key': "flags.midi-qol.advantage.attack.mwak",
                'mode': 0,
                'value': 1,
                'priority': 0
            },
            {
                'key': "flags.midi-qol.advantage.attack.rwak",
                'mode': 0,
                'value': 1,
                'priority': 0
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'zephyrStrikeAdvantage': {
                        'active': true
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, advantageEffectData);
}

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Zephyr Strike - Advantage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Zephyr Strike - Advantage');
    console.log(featureData);
    async function effectMacro () {
        await warpgate.revert(token.document, 'Zephyr Strike');
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'zephyrStrike': {
                        'used': false
                    }
                },
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [featureData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Zephyr Strike',
        'description': effectData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}

export let zephyrStrike = {
    'damage': damage,
    'buff': buff,
    'postAttack': postAttack,
    'item': item
};