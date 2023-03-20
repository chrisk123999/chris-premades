import {chris} from '../../../helperFunctions.js';
async function saveItem({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1 || this.failedSaves.size === 1) return;
    let effect = chris.findEffect(this.actor, 'Psychic Link');
    let damageRoll = await new Roll('3d6[psychic]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Psychic Link'
    });
    await chris.applyDamage(this.token, damageRoll.total, 'psychic');
    if (effect) chris.removeEffect(effect);
}
async function item({speaker, actor, token, character, item, args}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Break Psychic Link', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Break Psychic Link');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Break Psychic Link');
	}
    let effectData = {
        'label': 'Psychic Link',
        'icon': this.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': this.item.uuid,
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
    await warpgate.mutate(this.targets.first().document, updates, {}, options);
}
async function sever({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let effect = chris.findEffect(this.targets.first().actor, 'Psychic Link');
    if (effect) await chris.removeEffect(effect);
}
async function pulse({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let nearbyTokens = chris.findNearby(targetToken, 30, 'ally');
    await chris.applyDamage(nearbyTokens, this.damageRoll.total, 'psychic');
}
export let psychicLink = {
    'item': item,
    'saveItem': saveItem,
    'sever': sever,
    'pulse': pulse
}