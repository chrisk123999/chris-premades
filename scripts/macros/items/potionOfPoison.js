import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size === 0 || chris.inCombat()) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let stacks = 3;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Potion of Poison - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Potion of Poison - Damage');
    featureData.system.save.dc = workflow.item.system.save.dc;
    delete featureData._id;
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    while (stacks > 0) {
        if (targetActor.system.attributes.hp.value === 0) break;
        let damageList = {
            3: '3d6[poison]',
            2: '2d6[poison]',
            1: '1d6[poison]'
        };
        featureData.system.damage.parts = [
            [
                damageList[stacks],
                'poison'
            ]
        ];
        let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetActor});
        await warpgate.wait(500);
        let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
        if (featureWorkflow.failedSaves.size === 0) {
            stacks -= 1;
        }
        if (stacks === 0) {
            let effect = chris.findEffect(targetActor, 'Potion of Poison');
            if (effect) await chris.removeEffect(effect);
            return;
        }
    }
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'potionOfPoison', 50);
    if (!queueSetup) return;
    if (workflow.targets.size != 1) return;
    let damageFormula = '3d6[poison]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function turnStart(token, actor, effect, origin) {
    let poisonedEffect = chris.findEffect(actor, 'Poisoned');
    if (!poisonedEffect) {
        effect.delete();
        return;
    }
    let stacks = await effect.getFlag('chris-premades', 'item.potionOfPosion.stacks');
    if (!stacks) stacks = 3;
    let damageList = {
        3: '3d6[poison]',
        2: '2d6[poison]',
        1: '1d6[poison]'
    };
    let damageFormula = damageList[stacks];
    let damageRoll = await new Roll(damageFormula).evaluate({async: true})
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: origin.name
    });
    await chris.applyDamage([token], damageRoll.total, 'poison');
}
async function turnEnd(token, actor, effect, origin) {
    let poisonedEffect = chris.findEffect(actor, 'Poisoned');
    if (!poisonedEffect) {
        effect.delete();
        return;
    }
    let stacks = await effect.getFlag('chris-premades', 'item.potionOfPosion.stacks');
    if (!stacks) stacks = 3;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Potion of Poison - Damage', false);
    if (!featureData) return;
    featureData.system.save.dc = origin.system.save.dc;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Potion of Poison - Damage');
    featureData.name = 'Potion of Poision';
    featureData.system.damage.parts = [];
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': actor});
    let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (featureWorkflow.failedSaves.size === 0) {
        stacks -= 1;
        if (stacks === 0) {
            effect.delete()
            return;
        }
        await effect.setFlag('chris-premades', 'item.potionOfPosion.stacks', stacks);
    }
}
export let potionOfPoison = {
    'item': item,
    'turnStart': turnStart,
    'turnEnd': turnEnd,
    'damage': damage
}