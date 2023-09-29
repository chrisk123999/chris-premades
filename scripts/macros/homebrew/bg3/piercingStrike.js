import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
import {constants} from '../../../constants.js';
import {translate} from '../../../translations.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    if (workflow.targets.size != 1) return;
    let race = chris.raceOrType(workflow.targets.first().actor);
    if (!(race === 'undead' || race === 'construct')) return;
    let effectData = {
        'label': 'Invalid Creature',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.str',
                'mode': 2,
                'value': '99',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave.con'
                ]
            }
        }
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.piercingStrike ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.piercingStrike': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
async function strike({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = [
        'rapier',
        'shortsword',
        'trident',
        'pike'
    ];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Piercing Strike');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'piercingstrike', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, [['Yes', true], ['No', false]], 'Use Piercing Strike?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let targetWorkflow = await MidiQOL.completeItemUse(feature2, config, options);
    if (targetWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.targets.first().actor, 'Gaping Wounds');
    if (effect) await chris.updateEffect(effect, {'origin': feature.uuid});
    queue.remove(workflow.item.uuid);
}
async function shot({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'rwak') return;
    let validTypes = [
        'lightcrossbow',
        'handcrossbow',
        'heavycrossbow'
    ];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Piercing Shot');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'piercingShot', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, [['Yes', true], ['No', false]], 'Use Piercing Shot?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    let targetWorkflow = await MidiQOL.completeItemUse(feature2, config, options);
    if (targetWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.targets.first().actor, 'Gaping Wounds');
    if (effect) await chris.updateEffect(effect, {'origin': feature.uuid});
    queue.remove(workflow.item.uuid);
}
async function damage(workflow) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Gaping Wounds');
    if (!effect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'piercingStrike', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = '2[' + translate.damageType('piercing') + ']';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
export let piercingStrike = {
    'item': item,
    'turn': turn,
    'strike': strike,
    'shot': shot,
    'damage': damage
}