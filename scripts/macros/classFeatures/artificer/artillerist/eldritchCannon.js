import {summons} from '../../../../utility/summons.js';
import {chris} from '../../../../helperFunctions.js';
import {constants} from '../../../../constants.js';
import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = [game.actors.getName('CPR - Eldritch Cannon')];
    if (!sourceActor) return;
    let mendingData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Mending (Eldritch Cannon)', false);
    if (!mendingData) return;
    mendingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mending (Eldritch Cannon)');
    mendingData.name = 'Mending';
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let artificerLevel = workflow.actor.classes?.artificer?.system?.levels;  
    if (!artificerLevel) return;
    let hpValue = (artificerLevel * 5);
    async function cannonUpdates() {
        let inputs =  [
            ['Flamethrower', {'type': 'flamethrower', 'name': 'Flamethrower'}], 
            ['Force Ballista', {'type': 'forceBallista', 'name': 'Force Ballista'}], 
            ['Protector', {'type': 'protector', 'name': 'Protector'}]
        ];
        let cannon = await chris.dialog(workflow.item.name, inputs, 'Select Eldritch Cannon Type');
        let cannonSize = await chris.dialog(workflow.item.name, [['Small', 'sm'], ['Tiny', 'tiny']], 'What size ' + cannon.name + ' cannon?');
        let cannonItemData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', cannon.name, false);
        if (!cannonItemData) return;
        cannonItemData.system.description.value = chris.getItemDescription('CPR - Descriptions', cannon.name);
        if (cannon.type === 'flamethrower') {
            cannonItemData.system.save.dc = chris.getSpellDC(workflow.item);
        } else if (cannon.type === 'protector') {
            cannonItemData.system.damage.parts[0][0] = cannonItemData.system.damage.parts[0][0] + ' + ' + workflow.actor.system.abilities.int.mod;
        }
        let name = chris.getConfiguration(workflow.item, 'name-' + cannon.type.toLowerCase()) ?? 'Eldritch Cannon';
        if (name === '') name = 'Eldritch Cannon';
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
                        'languages': {
                            'value': Array.from(workflow.actor.system?.traits?.languages?.value),
                        },
                        'size': cannonSize
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
                                'melee': chris.getSpellMod(workflow.item) + meleeAttackBonus.total,
                                'ranged': chris.getSpellMod(workflow.item) + rangedAttackBonus.total
                            }
                        }
                    }
                }
            },
            'token': {
                'name': name,
                'disposition': workflow.token.document.disposition,
                'height': 1,
                'width': 1,
                'texture': {
                    'scaleX': CONFIG.DND5E.actorSizes[cannonSize]?.token ?? CONFIG.DND5E.actorSizes[cannonSize]?.dynamicTokenScale,
                    'scaleY': CONFIG.DND5E.actorSizes[cannonSize]?.token ?? CONFIG.DND5E.actorSizes[cannonSize]?.dynamicTokenScale
                }
            },
            'embedded': {
                'Item': {
                    [cannonItemData.name]: cannonItemData
                }
            }
        };
        let avatarImg = chris.getConfiguration(workflow.item, 'avatar-' + cannon.type.toLowerCase());
        if (avatarImg) updates.actor.img = avatarImg;
        let tokenImg = chris.getConfiguration(workflow.item, 'token-' + cannon.type.toLowerCase());
        if (tokenImg) {
            setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
            setProperty(updates, 'token.texture.src', tokenImg);
        }
        if (artificerLevel >= 9) {
            let explosiveCannonData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Explosive Cannon', false);
            if (!explosiveCannonData) return;
            explosiveCannonData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Explosive Cannon');
            explosiveCannonData.system.save.dc = chris.getSpellDC(workflow.item);
            updates.embedded.Item['Explosive Cannon'] = explosiveCannonData;
            let damageString = updates.embedded.Item[cannonItemData.name].system.damage.parts[0][0];
            let newInteger = Number(damageString.charAt(0)) + 1;
            updates.embedded.Item[cannonItemData.name].system.damage.parts[0][0] = newInteger + damageString.slice(1);
        }
        return updates;
    }
    let updates = [await cannonUpdates()];
    if (!updates) return;
    if (artificerLevel >= 15) {
        if (!chris.getEffects(workflow.actor).find(e => e.flags['chris-premades']?.summons?.ids[workflow.item.name])) {
            let result = await chris.useSpellWhenEmpty(workflow, workflow.item.name, 'Use spell slot for second cannon?', {'consumeSlotOnly': true, 'skipEmptyCheck': true});
            if (result) {
                updates.push(await cannonUpdates());
                sourceActor.push(sourceActor[0]);
            }
        }
        let fortifiedPositionData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Fortified Position', false);
        if (!fortifiedPositionData) return;
        fortifiedPositionData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fortified Position');
        updates.forEach(update => update.embedded.Item[fortifiedPositionData.name] = fortifiedPositionData);
    }
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'default';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await summons.spawn(sourceActor, updates, 3600, workflow.item, workflow.token, 5, {spawnAnimation: animation});
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Eldritch Cannon - Command', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Eldritch Cannon - Command');
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
        'name': 'Eldritch Cannon',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + '; await warpgate.revert(token.document, "Eldritch Cannon");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}
async function explosiveCannon({speaker, actor, token, character, item, args, scope, workflow}) {
    await chris.applyDamage([workflow.token], '10000', 'none');
}
async function preItemRoll({speaker, actor, token, character, item, args, scope, workflow}) {
    await chris.useSpellWhenEmpty(workflow, workflow.item.name, 'Use spell slot for ' + workflow.item.name + '? (No uses left)');
}
async function forceBallista({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    await chris.pushToken(workflow.token, workflow.targets.first(), 5);
}
async function fortifiedPosition(workflow) {
    if (workflow.targets.size != 1 || !workflow.item || !constants.attacks.includes(workflow.item?.system?.actionType)) return;
    let targetToken = workflow.targets.first();
    let coverBonus = MidiQOL.computeCoverBonus(workflow.token, targetToken, workflow.item);
    if (coverBonus >= 2) return;
    let nearbyCannons = chris.findNearby(targetToken, 10, 'ally', false, true).filter(i => chris.findEffect(i.actor, 'Fortified Position'));
    if (!nearbyCannons.length) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'fortifiedPosition', 150);
    if (!queueSetup) return;
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, -2);
    workflow.attackAdvAttribution.add('Half-Cover: Fortified Position');
    workflow.setAttackRoll(updatedRoll);
    queue.remove(workflow.item.uuid);
}
export let eldritchCannon = {
    'item': item,
    'preItemRoll': preItemRoll,
    'explosiveCannon': explosiveCannon,
    'forceBallista': forceBallista,
    'fortifiedPosition': fortifiedPosition
};