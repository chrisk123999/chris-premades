import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function item(workflow) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'potionOfPoison', 50);
    if (!queueSetup) return;
    if (workflow.targets.size != 1) return;
    let damageFormula = '3d6[poison]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
    if (chris.inCombat()) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Potion of Poison');
    if (!effect) return;
    let stacks = 3;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Potion of Poison', false);
    if (!featureData) return;
    featureData.system.save.dc = workflow.item.system.save.dc;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Potion of Poison');
    while (stacks > 0) {
        if (targetActor.system.attributes.hp.value <= 0) break;
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
        let options = {
            'showFullCard': false,
            'createWorkflow': true,
            'targetUuids': [workflow.token.document.uuid],
            'configureDialog': false,
            'versatile': false,
            'consumeResource': false,
            'consumeSlot': false,
        };
        let feature = new CONFIG.Item.documentClass(featureData, {parent: targetActor});
        let featureWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
        if (featureWorkflow.failedSaves.size === 0) {
            stacks -= 1;
        }
        if (stacks === 0) {
            await chris.removeEffect(effect);
            break;
        }
        await warpgate.wait(500);
    }
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
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Potion of Poison', false);
    if (!featureData) return;
    featureData.system.save.dc = origin.system.save.dc;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Potion of Poison');
    featureData.system.damage.parts = [];
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let feature = new CONFIG.Item.documentClass(featureData, {parent: actor});
    let featureWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
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
    'turnEnd': turnEnd
}