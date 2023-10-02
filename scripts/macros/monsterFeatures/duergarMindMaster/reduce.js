import {translate} from '../../../translations.js';
import {chris} from '../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let piercing = translate.damageType('piercing');
    let psychic = translate.damageType('psychic');
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Hide', false);
    if (!featureData) return;
    featureData.system.activation.type = 'bonusaction';
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Hide');
    let updates = {
        'embedded': {
            'Item': {
                ['Mind-Poison Dagger']: {
                    'system': {
                        'damage': {
                            'parts': [
                                [
                                    '1[' + piercing + ']',
                                    piercing
                                ],
                                [
                                    '3d6[' + psychic + ']',
                                    psychic
                                ]
                            ]
                        }
                    }
                },
                [featureData.name]: featureData
            }
        }
    }
    let options = {
        'permanent': false,
        'name': 'Reduce',
        'description': workflow.item.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function end(token) {
    await warpgate.revert(token.document, 'Reduce');
}
export let reduce = {
    'item': item,
    'end': end
}