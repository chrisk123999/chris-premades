import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    if (!['mwak', 'rwak'].includes(workflow.item.system.actionType)) return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.brandingSmite);
    if (!effect) return;
    if (effect.flags['chris-premades'].spell.brandingSmite.used) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'brandingSmite', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = effect.flags['chris-premades'].spell.brandingSmite.level + 'd6[radiant]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    async function effectMacro() {
        let originEffect = await fromUuid(effect.origin);
        if (!originEffect) return;
        await chrisPremades.helpers.removeEffect(originEffect);
    }
    let effectData = {
        'icon': effect.icon,
        'origin': effect.uuid,
        'duration': {
            'seconds': effect.duration.seconds
        },
        'name': effect.name + ' - Brand',
        'changes': [
            {
                'key': 'ATL.light.dim',
                'mode': 4,
                'value': 5,
                'priority': 20
            }, {
                'key': 'system.traits.ci.value',
                'mode': 0,
                'value': 'invisible',
                'priority': 20
            }
        ],
        'flags': {
            'effectMacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    let targetEffect = await chris.createEffect(workflow.targets.first().actor, effectData);
    let updates = {
        'flags': {
            'chris-premades': {
                'spell': {
                    'brandingSmite': {
                        'used': true,
                        'targetEffectUuid': targetEffect.uuid
                    }
                }
            }
        }
    };
    await chris.updateEffect(effect, updates);
    queue.remove(workflow.item.uuid);
}

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    async function effectMacro() {
        await (warpgate.wait(200));
        let targetEffectUuid = effect.flags['chris-premades']?.spell?.brandingSmite?.targetEffectUuid;
        if (!targetEffectUuid) return;
        let targetEffect = await fromUuid(targetEffectUuid);
        if (!targetEffect) return;
        await chrisPremades.helpers.removeEffect(targetEffect);
    }
    let effectData = {
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'name': workflow.item.name,
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.brandingSmite.damage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'brandingSmite': {
                        'level': workflow.castData.castLevel,
                        'used': false
                    }
                }
            },
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    let effect = await chris.createEffect(workflow.actor, effectData);
    let updates = {
        'flags.chris-premades.spell.brandingSmite.targetEffectUuid': effect.uuid
    };
    await chris.updateEffect(effect, updates);
}

export let brandingSmite = {
    'damage': damage,
    'item': item
}