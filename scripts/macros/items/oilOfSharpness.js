import {chris} from '../../helperFunctions.js';
export async function oilOfSharpness({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let tokenDoc = workflow.targets.first().document;
    let generatedMenu = [];
    let mutationStack = warpgate.mutationStack(tokenDoc);
    let targetActor = workflow.targets.first().actor;
    targetActor.items.forEach(item => {
        if (item.type === 'weapon' && item.system.equipped === true) {
            let mutateItem = mutationStack.getName('Oil of Sharpness: ' + item.name);
            if (!mutateItem) generatedMenu.push([item.name, item.id]);
        }
    });
    let selection;
    if (generatedMenu.length === 0) return;
    if (generatedMenu.length === 1) selection = generatedMenu[0][1];
    if (!selection) selection = await chris.dialog('What weapon?', generatedMenu);
    if (!selection) return;
    let weaponData = duplicate(targetActor.items.get(selection).toObject());
    let oldAttackBonus = weaponData.system.attackBonus;
    weaponData.system.attackBonus = '3';
    switch (oldAttackBonus) {
        case '':
        case '0':
            weaponData.system.damage.parts[0][0] += ' + 3';
            break;
        case '1':
            weaponData.system.damage.parts[0][0] += ' + 2';
            break;
        case '2':
            weaponData.system.damage.parts[0][0] =+ ' + 1';
            break;
    }
    weaponData.system.properties.mgc = true;
    let updates = {
        'embedded': {
            'Item': {
                [weaponData.name]: weaponData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Oil of Sharpness: ' + weaponData.name,
        'description': 'Oil of Sharpness: ' + weaponData.name
    };
    await warpgate.mutate(tokenDoc, updates, {}, options);
    let effectData = {
        'label': 'Oil of Sharpness: ' + weaponData.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': "warpgate.revert(token.document, '" + 'Oil of Sharpness: ' + weaponData.name + "');"
                }
            }
        }
    };
    await chris.createEffect(targetActor, effectData);
}