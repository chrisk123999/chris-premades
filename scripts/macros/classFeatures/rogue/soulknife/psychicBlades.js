import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function early({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'psychicBladeEarly', 50);
    if (!queueSetup) return;
    let str = workflow.actor.system.abilities.str.mod;
    let dex = workflow.actor.system.abilities.dex.mod;
    let ability = dex > str ? 'dex' : 'str';
    let distance = chris.getDistance(workflow.token, workflow.targets.first());
    let type = distance > 5 ? 'rwak' : 'mwak';
    workflow.item = workflow.item.clone({'system.actionType': type, 'system.ability': ability}, {'keepId': true});
    queue.remove(workflow.item.uuid);
}
async function late({speaker, actor, token, character, item, args, scope, workflow}) {
    let psionicEnergy = chris.getItem(workflow.actor, 'Psionic Power: Psionic Energy');
    if (workflow.item.flags['chris-premades']?.feature?.homingStrikes?.used) {
        if (workflow.hitTargets.size && psionicEnergy) await feature.update({'system.uses.value': feature.system.uses.value - 1});
        await workflow.item.setFlag('chris-premades', 'feature.homkingStrikes.used', false);
    }
    if (workflow.item.flags['chris-premades']?.feature?.rendMind?.prompt) {
        let feature = chris.getItem(workflow.actor, 'Rend Mind');
        if (feature && psionicEnergy) {
            let featureUses = feature.system.uses.value;
            let psionicEnergyUses = psionicEnergy.system.uses.value;
            let selection;
            if (featureUses) {
                selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
                if (selection) await feature.update({'system.use.value': 0});
            } else if (psionicEnergyUses >= 3){
                selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '? (Use 3 ' + psionicEnergy.name + ')');
                if (selection) await psionicEnergy.update({'system.uses.value': psionicEnergyUses - 3});
            }
            if (selection) {
                let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
                await MidiQOL.completeItemUse(feature, config, options);
            }
        }
        await workflow.item.setFlag('chris-premades', 'feature.rendMind.prompt', false);
    }
    if (!chris.inCombat()) return;
    let effect = chris.findEffect(workflow.actor, 'Psychic Blades - Bonus');
    if (effect) return;
    let effectData = {
        'name': 'Psychic Blades - Bonus',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 1
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'await warpgate.revert(token.document, "Psychic Blades");'
                },
                'onEachTurn': {
                    'script': 'await chrisPremades.helpers.removeEffect(effect);'
                }
            }
        }
    };
    let feature = chris.getItem(workflow.actor, 'Psychic Blades');
    if (!feature) return
    let featureData = duplicate(feature.toObject());
    delete featureData._id;
    featureData.system.damage.parts[0][0] = '1d4[psychic] + @mod';
    featureData.system.activation.type = 'bonus';
    featureData.name = feature.name + ' (Bonus Action)';
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Psychic Blades',
        'description': 'Psychic Blades'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let feature = chris.getItem(workflow.actor, 'Soul Blades: Homing Strikes');
    let feature2 = chris.getItem(workflow.actor, 'Psionic Power: Psionic Energy');
    if (!feature || !feature2 || !workflow.targets.size) return;
    if (!feature2.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'homingStrikes', 150);
    if (!queueSetup) return;
    let attackTotal = workflow.attackTotal;
    let target = workflow.targets.first();
    let targetAC = target.actor.system.attributes.ac.value;
    if (targetAC <= attackTotal) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Attack roll (' + attackTotal + ') missed. Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let [config, options] = constants.syntheticItemWorkflowOptions([]);
    let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (!featureWorkflow.damageRoll) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, featureWorkflow.damageRoll.total);
    workflow.setAttackRoll(updatedRoll);
    await workflow.item.setFlag('chris-premades', 'feature.homingStrikes.used', true);
    queue.remove(workflow.item.uuid);
}
export let psychicBlades = {
    'early': early,
    'late': late,
    'attack': attack
}