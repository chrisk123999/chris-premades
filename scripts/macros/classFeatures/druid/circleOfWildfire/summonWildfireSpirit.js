import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Wildfire Spirit');
    if (!sourceActor) return;
    let druidLevel = workflow.actor.classes?.druid?.system?.levels;
    if (!druidLevel) return;
    let originEffect = chris.findEffect(workflow.actor, 'Wild Shape Passive');
    if (!originEffect) {
        ui.notifications.info('Wild Shape Item Effect Not Found!');
        return;
    }
    let wildShapeItem = await fromUuid(originEffect.origin);
    if (!wildShapeItem) return;
    let wildShapeValue = wildShapeItem.system?.uses?.value;
    if (!wildShapeValue) {
        ui.notifications.info('No Wild Shape Uses Left!');
        return;
    }
    let flameSeedData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Flame Seed', false);
    if (!flameSeedData) return;
    flameSeedData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Flame Seed');
    let fieryTeleportationData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Fiery Teleportation', false);
    if (!fieryTeleportationData) return;
    fieryTeleportationData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fiery Teleportation');
    fieryTeleportationData.system.save.dc = chris.getSpellDC(workflow.item);
    let commandData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Wildfire Spirit - Command', false);
    if (!commandData) return;
    commandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Wildfire Spirit - Command');
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let hpFormula = 5 + (druidLevel * 5);
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Wildfire Spirit';
    if (name === '') name = 'Wildfire Spirit';
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
                        'max': hpFormula,
                        'value': hpFormula
                    }
                },
                'traits': {
                    'languages': workflow.actor.system?.traits?.languages
                }
            },
            'prototypeToken': {
                'name': name
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.dex.mod + Number(workflow.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.dex.mod + Number(workflow.actor.system.bonuses.rsak.attack)
                        }
                    }
                }
            }
        },
        'embedded': {
            'Item': {
                [flameSeedData.name]: flameSeedData,
                [fieryTeleportationData.name]: fieryTeleportationData,
                [dodgeData.name]: dodgeData
            }
        },
        'token': {
            'name': name
        }
    }
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let spawnedToken = await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item);
    let updates2 = {
        'embedded': {
            'Item': {
                [commandData.name]: commandData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': name,
        'description': commandData.name
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
                    'script': currentScript + ' await warpgate.revert(token.document, "' + name + '");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': commandData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates); 
    await wildShapeItem.update({'system.uses.value': wildShapeValue - 1});
    let damageData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Summon Wildfire Spirit - Damage', false);
    if (!damageData) return;
    damageData.system.save.dc = chris.getSpellDC(workflow.item);
    spawnedToken = spawnedToken.object;
    let nearbyTargets = chris.findNearby(spawnedToken, 10, null).filter(t => t.id != workflow.token.id);
    if (nearbyTargets.length > 0) {
        let targetUuids = nearbyTargets.map(token => token.document.uuid);
        let [config, synthItemOptions] = constants.syntheticItemWorkflowOptions(targetUuids, false);
        let feature = new CONFIG.Item.documentClass(damageData, {'parent': workflow.actor});
        await warpgate.wait(100);
        await MidiQOL.completeItemUse(feature, config, synthItemOptions);
    }
}
async function fieryTeleportation({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'fieryTeleportation', 450);
    if (!queueSetup) return;
    let nearbyEnemies = chris.findNearby(workflow.token, 5, 'enemy');
    let nearbyTargets = chris.findNearby(workflow.token, 5, 'ally');
    let selection;
    let selectedTargets = [];
    if (nearbyTargets.length > 0) {
        let buttons = [
            {
                'label': 'Yes',
                'value': true
            }, {
                'label': 'No',
                'value': false
            }
        ];
        selection = await chris.selectTarget('Teleport Which Creatures?', buttons, nearbyTargets, true, 'multiple');
        if (!selection.buttons) {
            queue.remove(workflow.item.uuid);
            return;
        }
        for (let i of selection.inputs) {
            if (i) selectedTargets.push((await fromUuid(i)).object);
        }
    }
    selectedTargets.push(workflow.token);
    if (!selectedTargets) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await workflow.actor.sheet.minimize();
    let icon = workflow.token.document.texture.src;
    let position = await chris.aimCrosshair(workflow.token, 15, icon, -1, workflow.token.document.width);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        queue.remove(workflow.item.uuid);
        return;
    }
    let difference = {x: workflow.token.x, y: workflow.token.y};
    for (let i = 0; selectedTargets.length > i; i++) {
        let targetToken = selectedTargets[i];
        await new Sequence()
            .effect()
                .file('jb2a.misty_step.01.blue')
                .atLocation(targetToken)
                .randomRotation()
                .scaleToObject(2)
                .wait(750)
                .animation()
                .on(targetToken)
                .opacity(0.0)
                .waitUntilFinished()
            .play();
        let diffX = targetToken.x - difference.x;
        let diffY = targetToken.y - difference.y;
        let newCenter = canvas.grid.getSnappedPosition(position.x - targetToken.w / 2, position.y - targetToken.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x + diffX,
                'y': newCenter.y + diffY
            }
        };
        let options = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name,
            'updateOpts': {'token': {'animate': false}}
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
        await new Sequence()
            .effect()
                .file('jb2a.misty_step.02.blue')
                .atLocation(targetToken)
                .randomRotation()
                .scaleToObject(2)
                .wait(500)
                .animation()
                .on(targetToken)
                .opacity(1.0)
            .play();
        await warpgate.wait(100);
    }
    await workflow.actor.sheet.maximize();
    if (nearbyEnemies.length > 0) {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Fiery Teleportation - Damage', false);
        if (!featureData) return;
        featureData.system.save.dc = chris.getSpellDC(workflow.item);
        let targetTokens = nearbyEnemies.map(token => token.document.uuid);
        let [config, options] = constants.syntheticItemWorkflowOptions(targetTokens, false);
        let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
        await warpgate.wait(100);
        await MidiQOL.completeItemUse(feature, config, options);
    }
    queue.remove(workflow.item.uuid);
}
export let summonWildfireSpirit = {
    item: item,
    fieryTeleportation: fieryTeleportation
}