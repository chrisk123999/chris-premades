import {summons} from '../../../../utility/summons.js';
import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) { // 1 hr duration, 
    let sourceActor = game.actors.getName('CPR - Eldritch Cannon');
    if (!sourceActor) return;
    let mendingData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Mending (Eldritch Cannon)', false);
    if (!mendingData) return;
    mendingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mending (Eldritch Cannon)');
    mendingData.name = 'Mending';
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let artificerLevel = workflow.actor.classes?.artificer?.system?.levels;  
    if (!artificerLevel) return; // if workflow.options.useSpellWhenEmpty then ask if use another to summon
    let hpValue = (artificerLevel * 5);
    let cannon1 = await chris.dialog(workflow.item.name, [['Flamethrower', 'flamethrower'], ['Force Balista', 'forceBalista'], ['Protector', 'protector']], 'Select Eldritch Cannon Type');
    let cannon2 = undefined;
    let name1 = chris.getConfiguration(workflow.item, 'name-' + cannon1) ?? 'Eldritch Cannon';
    if (name1 === '') name1 = 'Eldritch Cannon';
    let meleeAttackBonus = await new Roll(workflow.actor.system.bonuses.msak.attack + ' + 0', workflow.actor.getRollData()).roll({'async': true});
    let rangedAttackBonus = await new Roll(workflow.actor.system.bonuses.rsak.attack + ' + 0', workflow.actor.getRollData()).roll({'async': true});
    let updates1 = {
        'actor': {
            'name': name1,
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
                'name': name1,
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
            'name': name1,
            'disposition': workflow.token.document.disposition
        }
    };
    if (artificerLevel >= 9) {
        // level 9 explosive cannon, damage rolls increased by 1d8, explosion feature,
        let explosiveCannonData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Explosive Cannon', false);
        if (!explosiveCannonData) return;
        explosiveCannonData.system.description.value = chris.getItemDescription('Explosive Cannon');
        updates.embedded.Item['Explosive Cannon'] = explosiveCannonData;
        updates.embedded.Item['Deflect Attack'].system.damage.parts[0][0] = '1d4[force] + ' + chris.getSpellMod(workflow.item);
    }
    if (artificerLevel >= 15) { // half cover while within 10 feet of the cannon, can make two cannons (will take 2 slots)
        if (!chris.getEffects(workflow.actor).find(e => e.flags['chris-premades']?.summons?.ids[workflow.item.name])) {
            if (workflow.config.useSpellWhenEmpty) {
                let result = chris.useSpellWhenEmpty(workflow, workflow.item.name, 'Use spell slot for second cannon?', {'consumeSlotOnly': true});
                if (result) {
                    let cannon2 = await chris.dialog('Select Second Eldritch Cannon Type', [['Flamethrower', 'Flamethrower'], ['Force Balista', 'Force Balista'], ['Protector', 'Protector']]);
                    if (!cannon2) cannon2 = undefined;
                }
            }
        }
        //fortified position effect     
    }
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
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
async function preItemRoll({speaker, actor, token, character, item, args, scope, workflow}) {
    await chris.useSpellWhenEmpty(workflow, workflow.item.name, 'Use spell slot for' + workflow.item.name + '? (No uses left)');
}
async function attack(workflow) {
    if (workflow.targets.size != 1 || !workflow.item || !constants.attacks.includes(workflow.item?.system?.actionType)) return;
    let targetToken = workflow.targets.first();
    let coverBonus = MidiQOL.computeCoverBonus(workflow.token, targetToken, workflow.item);
    if (coverBonus >= 2) return;
    let nearbyShrouds = chris.findNearby(targetToken, 30, 'ally', false, true).filter(i => chris.findEffect(i.actor, 'Channel Divinity: Twilight Sanctuary') && chris.getItem(i.actor, 'Twilight Shroud'));
    if (!nearbyShrouds.length) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'twilightShroud', 150);
    if (!queueSetup) return;
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, -2);
    let feature = chris.getItem(nearbyShrouds[0].actor, 'Twilight Shroud');
    workflow.attackAdvAttribution.add('Half-Cover: ' + feature.name);
    workflow.setAttackRoll(updatedRoll);
    queue.remove(workflow.item.uuid);
}
async function repair({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Summoned Creature');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    origin.actor.setFlag('chris-premades', 'feature.steelDefenderRepair', workflow.item.system?.uses?.value);
}
export let eldritchCannon = {
    'item': item,
    'preItemRoll': preItemRoll,
    'longRest': longRest,
    'repair': repair,
}