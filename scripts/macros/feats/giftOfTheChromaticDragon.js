import {chris} from '../../helperFunctions.js';
async function chromaticInfusion({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetWeapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (targetWeapons.length === 0) return;
    let selection;
    if (targetWeapons.length === 1) selection = targetWeapons[0];
    if (!selection) selection = await chris.selectDocument('Which weapon gets infused?', targetWeapons);
    if (!selection) return;
    let damageType = await chris.dialog(workflow.item.name, [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☠️ Poision', 'poison']], 'Which damage type?');
    if (!damageType) return;
    async function effectMacro() {
        await warpgate.revert(token.document, 'Chromatic Infusion');
    }
    let effectData = {
        'name': 'Chromatic Infusion',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    let damageParts = selection[0].system.damage.parts;
    damageParts.push(['1d4[' + damageType + ']', damageType]);
    let updates = {
        'embedded': {
            'Item': {
                [selection[0].name]: {
                    'system': {
                        'damage.parts': damageParts,
                    }
                }
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Chromatic Infusion',
        'description': 'Chromatic Infusion'
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
}
async function reactiveResistance({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog(workflow.item.name, [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☠️ Poision', 'poison']], 'What damage type?');
    if (!selection) return;
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': selection,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    '1Reaction'
                ],
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
}
export let giftOfTheChromaticDragon = {
    'chromaticInfusion': chromaticInfusion,
    'reactiveResistance': reactiveResistance
}