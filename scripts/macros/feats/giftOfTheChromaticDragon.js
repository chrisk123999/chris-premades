import { chris } from '../../helperFunctions.js';

async function chromaticInfusion({ speaker, actor, token, character, item, args, scope, workflow }) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetWeapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (targetWeapons.length === 0) return;
    let selection;
    if (targetWeapons.length === 1) selection = targetWeapons[0].name;
    if (!selection) selection = await chris.remoteDialog(workflow.item.name, targetWeapons.map(i => [i.name, i.name]), chris.firstOwner(targetToken).id, 'Which weapon gets infused?');
    if (!selection) return;
    let weapon = targetToken.actor.items.getName(selection);
    if (!weapon) return;

    const damageType = await chris.remoteDialog(workflow.item.name, ['acid', 'cold', 'fire', 'lightning', 'poison'].map(i => [i, i]), chris.firstOwner(targetToken).id, 'Which damage type?');
    if (!damageType) return;

    async function effectMacro() {
        await warpgate.revert(token.document, 'Chromatic Infusion');
    }
    let effectData = {
        'label': 'Chromatic Infusion',
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
    let damageParts = weapon.system.damage.parts;
    damageParts.push(['1d4[' + damageType + ']', damageType]);
    let updates = {
        'embedded': {
            'Item': {
                [selection]: {
                    'system': {
                        'damage.parts': damageParts,
                    }
                }
            },
            'ActiveEffect': {
                [effectData.label]: effectData
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

export let giftOfTheChromaticDragon = {
    'chromaticInfusion': chromaticInfusion,
}