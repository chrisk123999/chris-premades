import {summons} from '../../../../utility/summons.js';
import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Eldritch Cannon');
    if (!sourceActor) return;
    let mendingData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Mending (Eldritch Cannon)', false);
    if (!mendingData) return;
    mendingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mending (Eldritch Cannon)');
    mendingData.name = 'Mending';
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let artificerLevel = workflow.actor.classes?.artificer?.system?.levels;
    if (!artificerLevel) return;
    let hpValue = (artificerLevel * 5);
    let sourceActors = [];
    function selectCanon(count) {
        let selection = chris.dialog('Select Eldritch Cannon Type', [['Flamethrower', 'Flamethrower'], ['Force Balista', 'Force Balista'], ['Protector', 'Protector']]);
        sourceActor.toObject;
    }
    if (artificerLevel >= 15) {

    }
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Steel Defender';
    if (name === '') name = 'Steel Defender';
    let meleeAttackBonus = await new Roll(workflow.actor.system.bonuses.msak.attack + ' + 0', workflow.actor.getRollData()).roll({'async': true});
    let rangedAttackBonus = await new Roll(workflow.actor.system.bonuses.rsak.attack + ' + 0', workflow.actor.getRollData()).roll({'async': true});
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof)
                },
                'attributes': {
                    'hp': {
                        'formula': hpValue,
                        'max': hpValue,
                        'value': hpValue
                    }
                },
                'traits': {
                    'languages': workflow.actor.system?.traits?.languages
                }
            },
            'prototypeToken': {
                'name': name,
                'disposition': workflow.token.document.disposition
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + meleeAttackBonus.total,
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + rangedAttackBonus.total
                        }
                    }
                }
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        },
        'embedded': {
            'Item': {
                [deflectAttackData.name]: deflectAttackData,
                [forceEmpoweredRendData.name]: forceEmpoweredRendData,
                [mendingData.name]: mendingData,
                [repairData.name]: repairData,
                [vigilantData.name]: vigilantData,
                [dodgeData.name]: dodgeData
            }
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    if (artificerLevel > 8) {
        if (artificerLevel > 14) {
            updates.actor.system.attributes.ac = {'flat': 17};
            updates.embedded.Item['Deflect Attack'].system.damage.parts[0][0] = '1d4[force] + ' + chris.getSpellMod(workflow.item)
        }
        updates.embedded.Item['Arcane Jolt'] = arcaneJoltData;
        sourceActor.setFlag('chris-premades', 'feature.arcaneJoltScale', workflow.actor.system?.scale?.['battle-smith']?.['arcane-jolt'].formula);;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'default';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    let spawnedToken = await tashaSummon.spawn(sourceActor, updates, 86400, workflow.item, 120, workflow.token, animation);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Steel Defender - Command', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Steel Defender - Command');
    if (!featureData) return;
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Steel Defender',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, 'Steel Defender');
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "Steel Defender");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    if (artificerLevel > 8) setProperty(effectUpdates, 'flags.chris-premades.feature.steelDefender.spawnedTokenUuid', spawnedToken.uuid);
    await chris.updateEffect(effect, effectUpdates);

}
async function longRest(actor, data) {
    if (!data.longRest) return;
    if (actor.classes?.arificer?.system?.levels < 3) return;
    let item = actor.items.getName('Battle Smith');
    if (!item) return;
    if (item.type != 'subclass') return;
    actor.setFlag('chris-premades', 'feature.steelDefenderRepair', 3);
}
async function repair({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Summoned Creature');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    origin.actor.setFlag('chris-premades', 'feature.steelDefenderRepair', workflow.item.system?.uses?.value);
}
export let steelDefender = {
    'item': item,
    'longRest': longRest,
    'repair': repair,
}