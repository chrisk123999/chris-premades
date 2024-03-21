import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.system.actionType === 'mwak');
    if (!weapons.length) {
        ui.notifications.info('No equipped weapons found!');
        return;
    }
    let selection;
    if (weapons.length === 1) selection = weapons[0];
    if (!selection) [selection] = await chris.selectDocument('Attack with what weapon?', weapons);
    if (!selection) return;
    let level = chris.levelOrCR(workflow.actor);
    let diceNumber = Math.floor((level + 1) / 6);
    let weaponData = duplicate(selection.toObject());
    delete weaponData._id;
    setProperty(weaponData, 'flags.chris-premades.spell.boomingBlade', true);
    if (level > 4) weaponData.system.damage.parts.push([diceNumber + 'd8[' + translate.damageType('thunder') + ']', 'thunder']);
    let weapon = new CONFIG.Item.documentClass(weaponData, {'parent': workflow.actor});
    weapon.prepareData();
    weapon.prepareFinalAttributes();
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    let attackWorkflow = await MidiQOL.completeItemUse(weapon, config, options);
    if (!attackWorkflow) return;
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'blue';
    if (chris.jb2aCheck() != 'patreon' && animation != 'none') animation = 'blue';
    if (animation != 'none') {
        if (animation === 'random') {
            let colors = [
                'blue',
                'blue02',
                'dark_purple',
                'dark_red',
                'green',
                'green02',
                'orange',
                'red',
                'purple',
                'yellow',
                'blue'
            ]
            animation = colors[Math.floor(Math.random() * colors.length)];
        }
        new Sequence()
            .effect()
            .file('jb2a.static_electricity.01.' + animation)
            .atLocation(workflow.targets.first())
            .scaleToObject(1.5)
            .play();
    }
    if (!attackWorkflow.hitTargets.size) return;
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 12
        },
        'origin': workflow.item.uuid,
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnStartSource'
                ]
            },
            'chris-premades': {
                'spell': {
                    'boomingBlade': {
                        'diceNumber': diceNumber + 1
                    }
                }
            }
        }
    };
    let effect = chris.findEffect(attackWorkflow.targets.first().actor, effectData.name);
    if (effect) {
        if (effect.flags['chris-premades']?.spell?.boomingBlade?.diceNumber > diceNumber) {
            return;
        } else {
            await chris.removeEffect(effect);
        }
    }
    await chris.createEffect(attackWorkflow.targets.first().actor, effectData);
}
async function moved(token, changes) {
    if (!chris.isLastGM()) return;
    if (token.parent.id != canvas.scene.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    let effect = chris.getEffects(token.actor).find(i => i.flags['chris-premades']?.spell?.boomingBlade);
    if (!effect) return;
    await token.object?._animation;
    let selection = await chris.dialog(effect.name, constants.yesNo, 'Did ' + token.actor.name + ' move willingly?');
    if (!selection) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Booming Blade - Movement', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Booming Blade - Movement');
    delete featureData._id;
    featureData.system.damage.parts = [
        [
            effect.flags['chris-premades'].spell.boomingBlade.diceNumber + 'd8[' + translate.damageType('thunder') + ']',
            'thunder'
        ]
    ];
    if (!effect.origin) return;
    let originItem = await fromUuid(effect.origin);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
    await chris.removeEffect(effect);
}
export let boomingBlade = {
    'item': item,
    'moved': moved
}