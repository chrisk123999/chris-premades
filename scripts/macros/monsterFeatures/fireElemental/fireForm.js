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
export async function douseFire({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Fire Form');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export async function item({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
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
        'origin': this.item.uuid,
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