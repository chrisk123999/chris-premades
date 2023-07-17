import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetWeapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (targetWeapons.length === 0) return;
    let selection;
    if (targetWeapons.length === 1) selection = targetWeapons[0].name;
    if (!selection) selection = await chris.remoteDialog(workflow.item.name, targetWeapons.map(i => [i.name, i.name]), chris.firstOwner(targetToken).id, 'What weapon gets imbued?');
    if (!selection) return;
    let weapon = targetToken.actor.items.getName(selection);
    if (!weapon) return;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Holy Weapon - Target');
    }
    let effectData = {
        'label': 'Holy Weapon - Target',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'ATL.light.bright',
                'mode': 4,
                'value': 30,
                'priority': 20
            },
            {
                'key': 'ATL.light.dim',
                'mode': 4,
                'value': 60,
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    let damageParts = weapon.system.damage.parts;
    damageParts.push(['2d8[radiant]']);
    let updates = {
        'embedded': {
            'Item': {
                [selection]: {
                    'system': {
                        'damage.parts': damageParts,
                        'properties.mgc': true
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
        'name': 'Holy Weapon - Target',
        'description': 'Holy Weapon - Target'
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Holy Weapon - Dismiss', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Holy Weapon - Dismiss', false);
    async function effectMacro2 () {
        await warpgate.revert(token.document, 'Holy Weapon');
    }
    let effectData2 = {
        'label': 'Holy Weapon',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'flags.chris-premades.spell.holyWeapon',
                'mode': 5,
                'value': targetToken.document.uuid,
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
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData2.label]: effectData2
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Holy Weapon',
        'description': 'Holy Weapon'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetTokenUuid = workflow.actor.flags['chris-premades']?.spell?.holyWeapon;
    if (!targetTokenUuid) return;
    let targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
    let featureData = await chrisPremades.helpers.getItemFromCompendium('chris-premades.CPR Spell Features', 'Holy Weapon - Burst', false);
    if (!featureData) return;
    let effect = chris.findEffect(workflow.actor, 'Holy Weapon');
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
    let effect2 = chris.findEffect(targetToken.actor, 'Holy Weapon - Target');
    if (effect2) chris.removeEffect(effect2);
    await chris.removeCondition(workflow.actor, 'Concentrating');
}
export let holyWeapon = {
    'item': item,
    'dismiss': dismiss
}