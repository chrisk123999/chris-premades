import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.searingSmite);
    if (!effect) return;
    if (effect.flags['chris-premades'].spell.searingSmite.used) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'searingSmite', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = effect.flags['chris-premades'].spell.searingSmite.level + 'd6[fire]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    async function effectMacro() {
        let originEffect = await fromUuid(effect.origin);
        if (!originEffect) return;
        let originItem = await fromUuid(originEffect.origin);
        if (!originItem) return;
        await chrisPremades.helpers.removeEffect(MidiQOL.getConcentrationEffect(originItem.actor, originItem));
    }
    let effectData = {
        'icon': effect.icon,
        'origin': effect.uuid,
        'duration': {
            'seconds': effect.duration.seconds
        },
        'name': effect.name + ' Fire',
        'changes': [
            {
                'key': 'flags.midi-qol.OverTime',
                'mode': 0,
                'value': 'turn=start, saveAbility=con, saveDC=' + effect.flags['chris-premades'].spell.searingSmite.dc + ' , saveMagic=true, damageRoll=1d6[fire], damageType=fire, name=Searing Smite',
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
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
                    'searingSmite': {
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
        let targetEffectUuid = effect.flags['chris-premades']?.spell?.searingSmite?.targetEffectUuid;
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
                'value': 'function.chrisPremades.macros.searingSmite.damage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'searingSmite': {
                        'dc': chris.getSpellDC(workflow.item),
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
    let effect = await chris.createEffect(workflow.actor, effectData, workflow.item);
    let updates = {
        'flags.chris-premades.spell.searingSmite.targetEffectUuid': effect.uuid
    };
    await chris.updateEffect(effect, updates);
}
export let searingSmite = {
    'damage': damage,
    'item': item
}