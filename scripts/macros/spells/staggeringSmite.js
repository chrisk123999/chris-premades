import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
import {constants} from '../../constants.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.staggeringSmite);
    if (!effect) return;
    let targetToken = workflow.targets.first();
    let queueSetup = await queue.setup(workflow.item.uuid, 'staggeringSmite', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '4d6[psychic]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Staggering Smite - Stagger');
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Staggering Smite - Stagger');
    delete featureData._id;
    featureData.system.save.dc = effect.flags['chris-premades'].spell.staggeringSmite.dc;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    await chris.removeEffect(effect);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
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
                'value': 'function.chrisPremades.macros.staggeringSmite.damage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'staggeringSmite': {
                        'dc': chris.getSpellDC(workflow.item)
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
export let staggeringSmite = {
    'damage': damage,
    'item': item
};