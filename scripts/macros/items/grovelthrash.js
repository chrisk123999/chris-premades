import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let level = workflow.actor.flags['chris-premades']?.item?.grovelthrash?.level;
    if (!level) return;
    if (workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'grovelthrash', 50);
    if (!queueSetup) return;
    let selected = await chris.dialog('Activate Grovelthrash?', [['Yes', true], ['No', false]]);
    let damageDiceNum = 0;
    if (selected) {
        damageDiceNum = 2;
    }
    if (level > 0) if (Math.floor(workflow.actor.system.attributes.hp.max / 2) > workflow.actor.system.attributes.hp.value) damageDiceNum += 2;
    if (damageDiceNum === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageDice = damageDiceNum + 'd6[bludgeoning]';
    if (workflow.isCritical) damageDice = chris.getCriticalFormula(damageDice);
    let damageFormula = workflow.damageRoll._formula + ' + ' + damageDice;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    if (selected) {
        let selfDamageFormula = '1d6[psychic]';
        let selfDamageRoll = await new Roll(selfDamageFormula).roll({async: true});
        selfDamageRoll.toMessage({
            rollMode: 'roll',
            speaker: {alias: name},
            flavor: workflow.item.name
        });
        await chris.applyDamage([workflow.token], selfDamageRoll.total, 'psychic');
    }
    queue.remove(workflow.item.uuid);
}
async function equip(actor, origin, level) {
    let charges = origin.flags['chris-premades']?.item?.grovelthrash?.charges?.reaction;
    if (charges === undefined) charges = 1;
    let itemData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Grovelthrash Reaction', false);
    if (!itemData) return;
    itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Grovelthrash Reaction');
    itemData.system.uses.value = charges;
    await chris.addTempItem(actor, itemData, origin.id, 'Grovelthrash', false, 0);
    if (level > 0) {
        let earthquakeData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Spell Compendium'), 'Earthquake', false);
        if (!earthquakeData) return;
        let eCharges = origin.flags['chris-premades']?.item?.grovelthrash?.charges?.earthquake;
        if (eCharges === undefined) eCharges = 1;
        earthquakeData.system.uses.per = 'day';
        earthquakeData.system.uses.max = 1;
        earthquakeData.system.uses.value = eCharges;
        earthquakeData.system.preparation.mode = 'atwill';
        earthquakeData.system.preparation.prepared = true;
        await chris.addTempItem(actor, earthquakeData, origin.id, 'Grovelthrash', false, 1);
        let meldIntoStoneData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Spell Compendium'), 'Meld into Stone', false);
        if (!meldIntoStoneData) return;
        let mCharges = origin.flags['chris-premades']?.item?.grovelthrash?.charges?.meldIntoStone;
        if (mCharges === undefined) mCharges = 1;
        meldIntoStoneData.system.uses.per = 'day';
        meldIntoStoneData.system.uses.max = 1;
        meldIntoStoneData.system.uses.value = mCharges;
        meldIntoStoneData.system.preparation.mode = 'atwill';
        meldIntoStoneData.system.preparation.prepared = true;
        await chris.addTempItem(actor, meldIntoStoneData, origin.id, 'Grovelthrash', false, 2);
        let stoneShapeData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Spell Compendium'), 'Stone Shape', false);
        if (!stoneShapeData) return;
        let sCharges = origin.flags['chris-premades']?.item?.grovelthrash?.charges?.stoneShape;
        if (sCharges === undefined) sCharges = 1;
        stoneShapeData.system.uses.per = 'day';
        stoneShapeData.system.uses.max = 1;
        stoneShapeData.system.uses.value = sCharges;
        stoneShapeData.system.preparation.mode = 'atwill';
        stoneShapeData.system.preparation.prepared = true;
        await chris.addTempItem(actor, stoneShapeData, origin.id, 'Grovelthrash', false, 3);
    }
}
async function unequip(actor, origin, level) {
    let rcharges = 1;
    let tempItem = chris.getTempItem(actor, origin.id, 0);
    if (tempItem) rcharges = tempItem.system.uses.value;
    if (level === 0) await origin.setFlag('chris-premades', 'item.grovelthrash.charges.reaction', rcharges);
    if (level > 0) {
        let eCharges = 1;
        let earthquakeItem = chris.getTempItem(actor, origin.id, 1);
        if (earthquakeItem) eCharges = earthquakeItem.system.uses.value;
        let mCharges = 1;
        let meldIntoStoneItem = chris.getTempItem(actor, origin.id, 2);
        if (meldIntoStoneItem) mCharges = meldIntoStoneItem.system.uses.value;
        let sCharges = 1;
        let stoneShapeItem = chris.getTempItem(actor, origin.id, 3);
        if (stoneShapeItem) sCharges = stoneShapeItem.system.uses.value;
        let charges = {
            'reaction': rcharges,
            'earthquake': eCharges,
            'meldIntoStone': mCharges,
            'stoneShape': sCharges
        };
        await origin.setFlag('chris-premades', 'item.grovelthrash.charges', charges);
    }
    await chris.removeTempItems(actor, origin.id);
}
async function deleted(actor, effect) {
    if (effect.disabled) return;
    let originArray = effect.origin.split('Item.');
    if (originArray.length != 2) return;
    let originID = originArray[1];
    await chris.removeTempItems(actor, originID);
}
export let grovelthrash = {
    'item': item,
    'equip': equip,
    'unequip': unequip,
    'deleted': deleted
}