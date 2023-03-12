import {chris} from '../../../../helperFunctions.js';
export async function crimsonRite(workflow) {
    let tokenDoc = workflow.token.document;
    let targetActor = workflow.actor;
    if (workflow.targets.size != 1) return;
    let damageDice = targetActor.system.scale['blood-hunter']['crimson-rite'];
    if (!damageDice) {
        ui.notifications.warn('Source actor does not appear to have a Crimson Rite scale!');
        return;
    }
    let generatedMenu = [];
    let mutationStack = warpgate.mutationStack(tokenDoc);
    targetActor.items.forEach(item => {
        if (item.type === 'weapon' && item.system.equipped === true) {
            let mutateItem = mutationStack.getName('Crimson Rite: ' + item.id);
            if (!mutateItem) generatedMenu.push([item.name, item.id]);
        }
    });
    let selection;
    if (generatedMenu.length === 0) return;
    if (generatedMenu.length === 1) selection = generatedMenu[0][1];
    if (!selection) selection = await chris.dialog('What weapon?', generatedMenu);
    if (!selection) return;
    let riteMenu = [];
    if (targetActor.items.getName('Crimson Rite: Rite of the Flame')) riteMenu.push(['Rite of the Flame', 'fire']);
    if (targetActor.items.getName('Crimson Rite: Rite of the Frozen')) riteMenu.push(['Rite of the Frozen', 'cold']);
    if (targetActor.items.getName('Crimson Rite: Rite of the Storm')) riteMenu.push(['Rite of the Storm', 'lightning']);
    if (targetActor.items.getName('Crimson Rite: Rite of the Dead')) riteMenu.push(['Rite of the Dead', 'necrotic']);
    if (targetActor.items.getName('Crimson Rite: Rite of the Oracle')) riteMenu.push(['Rite of the Oracle', 'psychic']);
    if (targetActor.items.getName('Crimson Rite: Rite of the Roar')) riteMenu.push(['Rite of the Roar', 'thunder']);
    if (targetActor.items.getName('Rite of the Dawn')) riteMenu.push(['Rite of the Dawn', 'radiant']);
    let damageType;
    if (riteMenu.length === 0) return;
    if (riteMenu.length === 1) damageType = riteMenu[0][1];
    if (!damageType) damageType = await chris.dialog('What Crimson Rite?', riteMenu);
    if (!damageType) return;
    let weaponData = targetActor.items.get(selection).toObject();
    weaponData.system.damage.parts.push([damageDice + '[' + damageType + ']', damageType]);
    let effectData = {
        'label': 'Crimson Rite: ' + weaponData.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 604800
        },
        'flags': {
            'dae': {
                'specialDuration': [
                    'zeroHP',
                    'longRest',
                    'shortRest'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            },
            'effectmacro': {
                'onDelete': {
                    'script': "warpgate.revert(token.document, '" + 'Crimson Rite: ' + weaponData._id + "');"
                }
            }
        }
    };
    if (damageType === 'radiant') {
        effectData.changes = [
            {
                'key': 'system.traits.dr.value',
                'mode': 2,
                'value': 'necrotic',
                'priority': 20
            },
            {
                'key': 'ATL.light.bright',
                'mode': 4,
                'value': '20',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'CPR-riteOfTheDawn,postDamageRoll',
                'priority': 20
            }
        ];
        weaponData.flags['chris-premades'] = {
            'feature': {
                'rotd': true
            }
        };
    }
    let updates = {
        'embedded': {
            'Item': {
                [weaponData.name]: weaponData
            },
            'ActiveEffect': {
                ['Crimson Rite: ' + weaponData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Crimson Rite: ' + weaponData._id,
        'description': 'Crimson Rite: ' + weaponData.name
    };
    await warpgate.mutate(tokenDoc, updates, {}, options);
}