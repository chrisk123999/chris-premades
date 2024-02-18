import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js'
import {queue} from '../../../../utility/queue.js';
async function runFeature(workflow, featureName) {
    let baseItem = workflow.item.system.type?.baseItem;
    if (workflow.hitTargets.size != 1 || baseItem != 'firearmCR') return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', featureName, false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', featureName);
    let originItem = chris.getItem(workflow.actor, featureName);
    if (!originItem) return;
    featureData._id = originItem.id;
    featureData.system.save.dc = chris.getSpellDC(originItem);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    return await MidiQOL.completeItemUse(feature, config, options);
}
async function wingingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    await runFeature(workflow, 'Winging Shot');
}
async function forcefulShot({speaker, actor, token, character, item, args, scope, workflow}) {
    let featureWorkflow = await runFeature(workflow, 'Forceful Shot');
    if (featureWorkflow.failedSaves.size != 1) return;
    await chris.pushToken(workflow.token, workflow.targets.first(), 15);
}
async function disarmingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    await runFeature(workflow, 'Disarming Shot');
}
async function dazingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    await runFeature(workflow, 'Dazing Shot');
}
async function piercingShot({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let weapons = workflow.actor.items.filter(i => i.system.type?.baseItem === 'firearmCR' && i.system.uses.value && i.system.equipped && !chris.getConfiguration(i, 'status'));
    if (!weapons.length) {
        ui.notifications.info('You have no equipped firearms with ammo!');
        return;
    }
    let weapon;
    if (weapons.length === 1) {
        weapon = weapons[0];
    } else {
        [weapon] = await chris.selectDocument(workflow.item.name, weapons);
    }
    if (!weapon) return;
    let range = weapon.system.range.value;
    let templateData = {
        'user': game.user,
        't': 'ray',
        'distance': range,
        'width': 5,
        'fillColor': game.user.color,
        'flags': {
            'dnd5e': {
                'origin': workflow.item.uuid
            },
            'midi-qol': {
                'originUuid': workflow.item.uuid
            }
        }
    };
    await workflow.actor.sheet.minimize();
    let {template, tokens} = await chris.placeTemplate(templateData, true);
    if (!template) return;
    tokens = tokens.filter(i => i.uuid != workflow.token.document.uuid);
    if (!tokens.length) return;
    let targetRanges = tokens.map(i => ({'uuid': i.uuid, 'distance': chris.getDistance(workflow.token, i)}));
    let closestTargetRange = Math.min(...targetRanges.map(i => i.distance));
    let closestTarget = targetRanges.find(i => i.distance === closestTargetRange);
    let weaponData = weapon.toObject();
    let misfireScore = (chris.getConfiguration(weapon, 'misfire') ?? 1) + 1;
    setProperty(weaponData, 'flags.chris-premades.configuration.misfire', misfireScore);
    delete weaponData._id;
    let [config, options] = constants.syntheticItemWorkflowOptions([closestTarget.uuid]);
    let newWeapon = new CONFIG.Item.documentClass(weaponData, {'parent': workflow.actor});
    await weapon.update({'system.uses.value': weapon.system.uses.value - 1});
    await warpgate.wait(100);
    let weaponWorkflow = await MidiQOL.completeItemUse(newWeapon, config, options);
    if (weaponWorkflow.attackRoll.terms[0].total <= misfireScore) {
        await template.delete();
        await workflow.actor.sheet.maximize();
        let updates = {
            'flags.chris-premades.configuration.status': 1,
            'name': weapon.name += ' (Damaged)'
        }
        await weapon.update(updates);
        return;
    }
    let otherTargets = tokens.filter(i => closestTarget.uuid != i.uuid);
    if (!otherTargets.length) {
        await template.delete();
        await workflow.actor.sheet.maximize();
        return;
    }
    let effectData = {
        'name': 'Piercing Shot - Disadvantage',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.attack.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            }
        ]
    };
    let effect = await chris.createEffect(workflow.actor, effectData);
    setProperty(weaponData, 'flags.chris-premades.configuration.misfire', -100);
    newWeapon = new CONFIG.Item.documentClass(weaponData, {'parent': workflow.actor});
    for (let i of otherTargets) {
        await warpgate.wait(100);
        options.targetUuids = [i.uuid];
        await MidiQOL.completeItemUse(newWeapon, config, options);
    }
    await template.delete();
    await chris.removeEffect(effect);
    await workflow.actor.sheet.maximize();
}
async function violentShotFeature({speaker, actor, token, character, item, args, scope, workflow}) {
    workflow.options.configureDialog = false;
    workflow.options.consumeResource = false;
    workflow.options.consumeQuantity = false;
    workflow.options.consumeUsage = false;
    let feature = chris.getItem(workflow.actor, 'Adept Marksman');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let options = [];
    for (let i = 1; i < feature.system.uses.value + 1; i++) options.push([i + ' Grit', i]);
    let selection = await chris.dialog(workflow.item.name, options, 'How many grit?');
    if (!selection) return;
    await feature.update({'system.uses.value': feature.system.uses.value - selection});
    let effectData = {
        'label': 'Violent Shot',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'value': 'function.chrisPremades.macros.trickShots.violentShot,preItemRoll',
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'feature': {
                    'violentShot': selection
                }
            },
            'dae': {
                'specialDuration': [
                    '1Attack'
                ]
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
async function violentShot({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.item) return;
    let baseItem = workflow.item.system.type?.baseItem;
    if (baseItem != 'firearmCR') return;
    let effect = chris.findEffect(workflow.actor, 'Violent Shot');
    if (!effect) return;
    let misfireBonus = effect.flags?.['chris-premades']?.feature?.violentShot;
    if (!misfireBonus) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'violentShot', 45);
    if (!queueSetup) return;
    let misfireScore = (chris.getConfiguration(workflow.item, 'misfire') ?? 1) + (misfireBonus * 2);
    let damageParts = workflow.item.system.damage.parts;
    if (!damageParts) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let roll = await new Roll(damageParts[0][0]).roll({async: true});
    let faces = roll.terms[0].faces;
    if (!faces) {
        queue.remove(workflow.item.uuid);
        return;
    }
    damageParts.push([[misfireBonus + 'd' + faces + '[' + damageParts[0][1] + ']'], damageParts[0][1]]);
    workflow.item = workflow.item.clone({'system.damage.parts': damageParts, 'flags.chris-premades.configuration.misfire': misfireScore}, {'keepId': true});
    queue.remove(workflow.item.uuid);
}
export let trickShots = {
    'dazingShot': dazingShot,
    'disarmingShot':disarmingShot,
    'forcefulShot': forcefulShot,
    'piercingShot': piercingShot,
    'violentShot': violentShot,
    'violentShotFeature': violentShotFeature,
    'wingingShot': wingingShot
}