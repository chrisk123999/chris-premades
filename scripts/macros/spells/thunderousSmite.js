import {queue} from '../../utility/queue.js';
import {chris} from '../../helperFunctions.js';
import {constants} from '../../constants.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.thunderousSmite);
    if (!effect) return;
    let targetToken = workflow.targets.first();
    let queueSetup = await queue.setup(workflow.item.uuid, 'thunderousSmite', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '2d6[thunder]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Thunderous Smite - Push');
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Thunderous Smite - Push');
    delete featureData._id;
    featureData.system.save.dc = effect.flags['chris-premades'].spell.thunderousSmite.dc;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await warpgate.wait(100);
    let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (featureWorkflow.failedSaves.size) {
        await chris.pushToken(workflow.token, targetToken, 10);
        if (!chris.checkTrait(targetToken.actor, 'ci', 'prone')) await chris.addCondition(targetToken.actor, 'Prone');
    }
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
                'value': 'function.chrisPremades.macros.thunderousSmite.damage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'thunderousSmite': {
                        'dc': chris.getSpellDC(workflow.item)
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
export let thunderousSmite = {
    'damage': damage,
    'item': item
}