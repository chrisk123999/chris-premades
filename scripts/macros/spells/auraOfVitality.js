import {chris} from '../../helperFunctions.js';
export async function auraOfVitality({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Aura of Vitality Healing', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Aura of Vitality Healing');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Aura of Vitality');
        await chrisPremades.macros.heatMetal.removed(effect);
	}
    let effectData = {
        'label': 'Aura of Vitality',
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
            }
        },
        'chris-premades': {
            'vae': {
                'button': featureData.name
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
        'name': effectData.label,
        'description': featureData.name,
        'origin': this.item.uuid
    };
    await warpgate.mutate(this.token.document, updates, {}, options);
}