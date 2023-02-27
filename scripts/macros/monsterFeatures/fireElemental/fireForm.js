import {chris} from '../../../helperFunctions.js';
export async function fireForm(workflow) {
    if (workflow.hitTargets.size != 1) return;
    if (!(workflow.item.system.actionType === 'mwak' || workflow.item.system.actionType === 'msak')) return;
    let targetToken = workflow.targets.first();
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    let targetActor = targetToken.actor;
    let feature = targetActor.items.getName('Fire Form');
    if (!feature) return;
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [workflow.token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
}
export async function douseFire(workflow) {
    let effect = chris.findEffect(workflow.actor, 'Fire Form');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export async function item(workflow) {
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