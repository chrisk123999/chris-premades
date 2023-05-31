import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {chris} from '../../../../helperFunctions.js';
export async function homunculusServant({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Homunculus Servant');
    if (!sourceActor) return;
    let mendingData = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', 'Mending', false);
    if (!mendingData) return;
    mendingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mending');
    let forceStrikeData = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', 'Force Strike', false);
    if (!forceStrikeData) return;
    forceStrikeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Force Strike');
    let channelMagicData = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', 'Channel Magic', false);
    if (!channelMagicData) return;
    channelMagicData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Channel Magic');
    let evasionData = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', 'Evasion', false);
    if (!evasionData) return;
    evasionData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Evasion');
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let artificerLevel = workflow.actor.classes.artificer.system.levels;
    if (!artificerLevel) return;
    let hpFormula = artificerLevel + 'd4 + ' + (1 + chris.getSpellMod(workflow.item));
    let hpValue = await new Roll(hpFormula).evaluate({async: true});
    let name = 'Homunculus Servant';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof)
                },
                'attributes': {
                    'hp': {
                        'formula': hpFormula,
                        'max': hpValue.total,
                        'value': hpValue.total
                    }
                }
            },
            'prototypeToken': {
                'name': name
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + Number(workflow.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + Number(workflow.actor.system.bonuses.rsak.attack)
                        }
                    }
                }
            }
        },
        'token': {
            'name': name
        },
        'embedded': {
            'Item': {
                [mendingData.name]: mendingData,
                [forceStrikeData.name]: forceStrikeData,
                [channelMagicData.name]: channelMagicData,
                [evasionData.name]: evasionData,
                [dodgeData.name]: dodgeData,
            }
        }
    };
    await tashaSummon.spawn(sourceActor, updates, 86400, workflow.item);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Features', 'Homunculus Servant - Command', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Homunculus Servant - Command');
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
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effectData = chris.findEffect(workflow.actor, 'Create Homunculus Servant');
    if (!effectData) return;
    let currentScript = effectData.flags.effectmacro.onDelete.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': `${currentScript} await warpgate.revert(token.document, \'Homunculus Servant - Command\');`
                }
            }
        }
    };
    await chris.updateEffect(effectData, effectUpdates);
}