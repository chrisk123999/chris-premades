import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    async function effectMacro() {
        let damageDice = '2d8[radiant]';
        let generatedMenu = [];
        let mutationStack = warpgate.mutationStack(token.document);
        actor.items.forEach(item => {
            if (item.type === 'weapon' && item.system.equipped === true) {
                let mutateItem = mutationStack.getName('Holy Weapon: ' + item.name);
                if (!mutateItem) generatedMenu.push([item.name, item.id]);
            }
        });
        let selection;
        if (generatedMenu.length === 0) return;
        if (generatedMenu.length === 1) selection = generatedMenu[0][1];
        if (!selection) selection = await chrisPremades.helpers.dialog('What weapon?', generatedMenu);
        if (!selection) return;
        let weaponData = actor.items.get(selection).toObject();
        weaponData.system.damage.parts.push([damageDice, 'radiant']);
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
            'name': 'Holy Weapon: ' + weaponData.name,
            'description': 'Holy Weapon: ' + weaponData.name
        };
        await warpgate.mutate(token.document, updates, {}, options);
        let macro = "await warpgate.revert(token.document, '" + 'Holy Weapon: ' + weaponData.name + "');"
        await effect.createMacro('onDelete', macro);
    }
    let effectData = {
        'label': 'Holy Weapon',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onCreate': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    await chris.createEffect(targetToken.actor, effectData);
    let featureData = await chrisPremades.helpers.getItemFromCompendium('chris-premades.CPR Spell Features', 'Holy Weapon - Dismiss', false);
    if (!featureData) return;
    featureData.system.description.value = chrisPremades.helpers.getItemDescription('CPR - Descriptions', 'Holy Weapon - Dismiss', false);
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': workflow.castData
        }
    };
    async function effectMacro2() {
        await warpgate.revert(token.document, 'Holy Weapon - Dismiss');
    }
    let effectData2 = {
        'label': featureData.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'flags.chris-premades.spell.holyWeapon',
                'mode': 5,
                'value': workflow.targets.first().document.uuid,
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro2)
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
                [featureData.name]: effectData2
            }
        }
    };
    let options = {
        'permanent': false,
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetTokenUuid = workflow.actor.flags['chris-premades']?.spell?.holyWeapon;
    if (!targetTokenUuid) return;
    let targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
    let featureData = await chrisPremades.helpers.getItemFromCompendium('chris-premades.CPR Spell Features', 'Holy Weapon - Burst', false);
    if (!featureData) return;
    let effect = chris.findEffect(workflow.actor, 'Holy Weapon - Dismiss');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let spellDC = chris.getSpellDC(originItem);
    featureData.system.description.value = chrisPremades.helpers.getItemDescription('CPR - Descriptions', 'Holy Weapon - Burst', false);
    featureData.effects[0].changes[0].value = 'label=Holy Weapon - Burst (End of Turn),turn=end,saveDC=' + spellDC + ',saveAbility=con,savingThrow=true,saveMagic=true,saveRemove=true';
    featureData.system.save.dc = spellDC;
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'castLevel': 5,
                'school': originItem.system.school
            }
        }
    };
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetToken.actor});
    await feature.use();
    await chris.removeEffect(effect);
    let effect2 = chris.findEffect(targetToken.actor, 'Holy Weapon');
    if (effect2) chris.removeEffect(effect2);
    await chris.removeCondition(workflow.actor, 'Concentrating');
}
export let holyWeapon = {
    'item': item,
    'dismiss': dismiss
}