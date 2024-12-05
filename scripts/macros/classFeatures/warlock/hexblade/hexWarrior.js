import {dialogUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({workflow}) {
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('two'));
    let existingHexWeaponEffect = weapons.map(i => Array.from(i.allApplicableEffects()).find(j => genericUtils.getIdentifier(j) === 'hexWarriorWeapon')).filter(i => i);
    if (existingHexWeaponEffect.length) await genericUtils.remove(existingHexWeaponEffect[0]);
    weapons = weapons.filter(i => i.system.equipped && !Array.from(i.allApplicableEffects()).find(j => genericUtils.getIdentifier(j) === 'pactWeapon'));
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.HexWarrior.NoWeapons', 'info');
        return;
    }
    let selection;
    if (weapons.length === 1) {
        selection = weapons[0];
    } else {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ElementalWeapon.SelectWeapon', weapons);
        if (!selection) return;
    }
    let enchantData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + workflow.item.name + ')',
                priority: 20
            }
        ]
    };
    let cha = workflow.actor.system.abilities.cha.mod;
    let ability = selection.system.activities.getByType('attack')[0]?.attack.ability;
    if (!ability?.length) ability = 'str';
    let score = workflow.actor.system.abilities[ability].mod;
    let dex = workflow.actor.system.abilities.dex.mod;
    let changed = false;
    let isFin = selection.system.properties.has('fin');
    if (isFin) {
        let mod = Math.max(dex, score);
        if (mod <= cha) {
            ability = 'cha';
            changed = true;
        }
    } else {
        if (score <= cha) {
            ability = 'cha';
            changed = true;
        }
    }
    if (changed) enchantData.changes.push({
        key: 'activities[attack].attack.ability',
        mode: 5,
        value: ability,
        priority: 20
    });
    await itemUtils.enchantItem(selection, enchantData, {identifier: 'hexWarriorWeapon'});
}
export let hexWarrior = {
    name: 'Hex Warrior',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};