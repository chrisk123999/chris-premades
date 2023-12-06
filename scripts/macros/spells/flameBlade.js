import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
export async function flameBlade({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Flame Blade Scimitar', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Flame Blade Scimitar');
    let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Evoke Flame Blade', false);
    if (!featureData2) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Evoke Flame Blade');
    let damageDice = 3;
    switch (workflow.castData.castLevel) {
        case 4:
        case 5:
            damageDice = 4
            break;
        case 6:
        case 7:
            damageDice = 5
            break;
        case 8:
        case 9:
            damageDice = 6;
            break;
    }
    featureData.system.damage.parts[0][0] = damageDice + 'd6[' + translate.damageType('fire') + ']';
    async function effectMacro () {
        await warpgate.revert(token.document, 'Flame Blade');
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 600
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'ATL.light.dim',
                'mode': 4,
                'value': '20',
                'priority': 20
            },
            {
                'key': 'ATL.light.bright',
                'mode': 4,
                'value': '10',
                'priority': 20
            }
        ],
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
                [featureData.name]: featureData,
                [featureData2.name]: featureData2
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Flame Blade',
        'description': 'Flamde Blade'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}