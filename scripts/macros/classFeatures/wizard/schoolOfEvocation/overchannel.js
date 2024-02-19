import {queue} from '../../../../utility/queue.js';
import {chris} from '../../../../helperFunctions.js';
import {constants} from '../../../../constants.js';
async function cast({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell') return;
    if (workflow.castData.castLevel === 0 || workflow.castData.castLevel > 5) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'overchannel', 350);
    if (!queueSetup) return;
    let oldDamageRoll = workflow.damageRoll;
    if (oldDamageRoll.terms.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let newDamageRoll = '';
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
        let flavor = oldDamageRoll.terms[i].flavor;
        let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
        if (isDeterministic) {
            newDamageRoll += oldDamageRoll.terms[i].formula;
        } else {
            newDamageRoll += '(' + oldDamageRoll.terms[i].number + '*' + oldDamageRoll.terms[i].faces + ')[' + flavor + ']';
        }
    }
    let damageRoll = await chris.damageRoll(workflow, newDamageRoll, undefined, true);
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function castComplete({speaker, actor, token, character, item, args, scope, workflow}) {
    let damageMult = workflow.actor.flags['chris-premades']?.feature?.overchannel;
    if (!damageMult) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Overchannel - Damage', false);
    if (!featureData) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'overchannel', 350);
    if (!queueSetup) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Overchannel - Damage');
    delete featureData._id;
    let diceNum = (damageMult + 1) * workflow.castData.castLevel;
    featureData.system.damage.parts[0][0] = diceNum + 'd12[none]';
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Overchannel - Used');
    if (!effect) {
        let effectData = {
            'label': 'Overchannel - Used',
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 604800
            },
            'changes': [
                {
                    'key': 'flags.chris-premades.feature.overchannel',
                    'mode': 5,
                    'value': 0,
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'specialDuration': [
                        'longRest'
                    ],
                    'macroRepeat': 'none'
                }
            }
        };
        await chris.createEffect(workflow.actor, effectData);
    } else {
        let updates = {
            'changes': [
                {
                    'key': 'flags.chris-premades.feature.overchannel',
                    'mode': 5,
                    'value': Number(effect.changes[0].value) + 1,
                    'priority': 20
                }
            ]
        }
        await chris.updateEffect(effect, updates);
    }
}
export let overchannel = {
    'item': item,
    'cast': cast,
    'castComplete': castComplete
}