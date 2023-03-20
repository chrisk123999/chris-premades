import {chris} from '../../helperFunctions.js';
export async function dragonsBreath({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let damageType = await chris.dialog('What damage type?', [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☠️ Poison', 'poison']]);
    if (!damageType) damageType = 'fire';
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Dragon Breath', false);
    if (!featureData) return;
    let diceNumber = this.castData.castLevel + 1;
    featureData.system.damage.parts = [
        [
            diceNumber + 'd6[' + damageType + ']',
            damageType
        ]
    ];
    featureData.system.save.dc = chris.getSpellDC(this.item);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dragon Breath');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Dragon Breath');
	}
    let effectData = {
        'label': featureData.name,
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
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [featureData.name]: effectData
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