import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    let damageType = workflow.item.system.damage.parts[1][1];
    if (workflow.d20AttackRoll === 20) {
		let animation = workflow.actor.flags['chris-premades']?.item?.dragonsWrathWeapon?.animation;
		if (!animation) return;
        let nearbyTargets = await chris.findNearby(targetToken, 5, 'ally');
        new Sequence().wait(1250).effect().file(animation).atLocation(targetToken).belowTokens(true).play();
        if (nearbyTargets.length != 0) await chris.applyDamage(nearbyTargets, 5, damageType);
    }
}
async function equip(actor, origin, level) {
    let charges = origin.flags['chris-premades']?.item?.dragonsWrath?.charges;
    if (charges === undefined) charges = 1;
    let itemData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Dragon\'s Wrath Breath', false);
    if (!itemData) return;
    let damageType = origin.system.damage.parts[1][1];
    let damageDice = '8d6';
    if (level === 1) {
        damageDice = '12d6';
        itemData.system.target.value = 60;
        itemData.system.save.dc = 18;
    }
    itemData.system.damage.parts = [
        [
            damageDice + '[' + damageType + ']',
            damageType
        ]
    ];
    itemData.system.uses.value = charges;
    itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dragon\'s Wrath Breath');
    await chris.addTempItem(actor, itemData, origin.id, 'Dragon\'s Wrath Weapon', false, 0);
}
async function unequip(actor, origin) {
    let charges = 1;
    let tempItem = chris.getTempItem(actor, origin.id, 0);
    if (tempItem) charges = tempItem.system.uses.value;
    await origin.setFlag('chris-premades', 'item.dragonsWrath.charges', charges);
    await chris.removeTempItems(actor, origin.id);
}
async function deleted(actor, effect) {
    if (effect.disabled) return;
    let originArray = effect.origin.split('Item.');
    if (originArray.length != 2) return;
    let originID = originArray[1];
    await chris.removeTempItems(actor, originID);
}
export let dragonsWrath = {
    'item': item,
    'equip': equip,
    'unequip': unequip,
    'deleted': deleted
}