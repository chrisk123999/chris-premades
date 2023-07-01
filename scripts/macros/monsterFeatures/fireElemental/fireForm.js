import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function fireForm(workflow, targetToken) {
    if (workflow.hitTargets.size === 0) return;
    if (!(workflow.item.system.actionType === 'mwak' || workflow.item.system.actionType === 'msak')) return;
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Fire Form');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
}
export async function douseFire({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Fire Form');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Douse Fire');
    if (effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Douse Fire', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Douse Fire');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Douse Fire');
    }
    let effectData = {
        'label': 'Douse Fire',
        'icon': featureData.img,
        'duration': {
            'seconds': 604800
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
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
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
}
export async function effectEnd(actor) {
    let effect = chris.findEffect(actor, 'Douse Fire');
    if (!effect) return;
    await chris.removeEffect(effect);
}