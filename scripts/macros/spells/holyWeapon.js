import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetWeapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (targetWeapons.length === 0) return;
    let selection;
    if (targetWeapons.length === 1) selection = targetWeapons[0];
    if (!selection) [selection] = await chris.remoteDocumentDialog(chris.firstOwner(targetToken).id, 'What weapon gets imbued?', targetWeapons);
    if (!selection) return;
    async function effectMacro () {
        await warpgate.wait(200);
        await warpgate.revert(token.document, 'Holy Weapon - Target');
    }
    let effectData = {
        'name': 'Holy Weapon - Target',
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
    let damageParts = selection.system.damage.parts;
    damageParts.push(['2d8[radiant]']);
    let updates = {
        'embedded': {
            'Item': {
                [selection.name]: {
                    'system': {
                        'damage.parts': damageParts,
                        'properties.mgc': true
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
        'name': 'Holy Weapon - Target',
        'description': 'Holy Weapon - Target'
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
    await chris.addDependents(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [targetToken.actor.effects.getName(effectData.name)]);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Holy Weapon - Dismiss', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Holy Weapon - Dismiss', false);
    setProperty(featureData, 'flags.chris-premades.spell.castData', workflow.castData);
    setProperty(featureData, 'flags.chris-premades.spell.castData.school', workflow.item.system.school);
    async function effectMacro2 () {
        await warpgate.revert(token.document, 'Holy Weapon');
    }
    let effectData2 = {
        'name': 'Holy Weapon',
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
                [effectData2.name]: effectData2
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Holy Weapon',
        'description': 'Holy Weapon'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
    await chris.addDependents(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [workflow.actor.effects.getName(workflow.item.name)]);
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
    let concentrationEffect = MidiQOL.getConcentrationEffect(workflow.actor, "Holy Weapon");
    await chris.removeEffect(concentrationEffect);
}
export let holyWeapon = {
    'item': item,
    'dismiss': dismiss
}