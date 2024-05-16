import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
import {constants} from '../../constants.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.wrathfulSmite);
    if (!effect) return;
    if (effect.flags['chris-premades'].spell.wrathfulSmite.used) return;
    let targetToken = workflow.targets.first();
    let queueSetup = await queue.setup(workflow.item.uuid, 'wrathfulSmite', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '1d6[psychic]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    let featureData= await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Wrathful Smite - Frighten');
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Wrathful Smite - Frighten');
    delete featureData._id;
    featureData.effects[0].duration.seconds = effect.duration.remaining;
    featureData.system.save.dc = effect.flags['chris-premades'].spell.wrathfulSmite.dc;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await warpgate.wait(100);
    let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    let targetEffect = featureWorkflow.failedSaves.first()?.actor?.appliedEffects?.find(currEffect => currEffect.origin === featureWorkflow._id);
    if (!targetEffect) {
        let conEffect = MidiQOL.getConcentrationEffect(workflow.actor, effect.origin);
        if (conEffect) await chris.removeEffect(conEffect);
    } else {
        let updates = {
            'flags': {
                'chris-premades': {
                    'spell': {
                        'wrathfulSmite': {
                            'used': true,
                            'targetEffectUuid': targetEffect.uuid
                        }
                    }
                }
            }
        };
        await chris.updateEffect(effect, updates);
        let updates2 = {
            'origin': effect.origin
        };
        await chris.updateEffect(targetEffect, updates2);
    }
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    async function effectMacro() {
        await warpgate.wait(200);
        let targetEffectUuid = effect.flags['chris-premades']?.spell?.wrathfulSmite?.targetEffectUuid;
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
                'value': 'function.chrisPremades.macros.wrathfulSmite.damage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'wrathfulSmite': {
                        'dc': chris.getSpellDC(workflow.item),
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
    await chris.createEffect(workflow.actor, effectData, workflow.item);
}
export let wrathfulSmite = {
    'damage': damage,
    'item': item
};