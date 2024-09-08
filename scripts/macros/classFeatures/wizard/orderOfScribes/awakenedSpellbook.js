import {dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    if (workflow.item.type !== 'spell') {
        if (workflow.item.type !== 'feat') return;
        if (!workflow.item.flags?.['chris-premades']?.castData?.castLevel) return;
    }
    let spellLevel = workflow.spellLevel;
    if (!spellLevel) spellLevel = workflow.item.flags?.['chris-premades']?.castData?.castLevel;
    if (!spellLevel) return;
    let oldDamageRolls = workflow.damageRolls;
    if (!oldDamageRolls?.length) return;
    let oldDamageTypes = workflowUtils.getDamageTypes(oldDamageRolls);
    let validSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.level === spellLevel && i.system.damage.parts.length);
    let values = [];
    switch (spellLevel) {
        case 1: {
            let magicMissile = itemUtils.getItemByIdentifier(workflow.actor, 'magicMissile');
            if (magicMissile) values.push(itemUtils.getConfig(magicMissile, 'damageType') ?? 'force');
            if (itemUtils.getItemByIdentifier(workflow.actor, 'chromaticOrb')) values.push('acid', 'cold', 'fire', 'lightning', 'poison', 'thunder');
            break;
        }
        case 2:
            if (itemUtils.getItemByIdentifier(workflow.actor, 'dragonsBreath')) values.push('acid', 'cold', 'fire', 'lightning', 'poison');
            break;
        case 3:
            if (itemUtils.getItemByIdentifier(workflow.actor, 'spiritShroud')) values.push('cold', 'necrotic', 'radiant');
            if (itemUtils.getItemByIdentifier(workflow.actor, 'vampiricTouch')) values.push('necrotic');
            break;
        case 5:
            if (itemUtils.getItemByIdentifier(workflow.actor, 'cloudkill')) values.push('poison');
            break;
    }
    values = new Set(values);
    for (let spell of validSpells) {
        for (let [_, currType] of spell.system.damage.parts) {
            if (currType?.length && !['healing', 'temphp', 'none', 'midi-none'].includes(currType)) values.add(currType);
        }
    }
    if (oldDamageTypes.size === 1) {
        values = values.difference(oldDamageTypes);
    }
    if (!values.size) return;
    let buttons = Array.from(values.map(i => ['DND5E.Damage' + i.capitalize(), i]));
    buttons.push(['CHRISPREMADES.Generic.No', false]);
    let selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.AwakenedSpellbook.Select', buttons);
    if (!selection) return;
    let newRolls = [];
    for (let oldRoll of oldDamageRolls) {
        newRolls.push(rollUtils.getChangedDamageRoll(oldRoll, selection));
    }
    await workflow.setDamageRolls(newRolls);
}
export let awakenedSpellbook = {
    name: 'Awakened Spellbook: Replace Damage',
    version: '0.12.62',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 49
            }
        ]
    }
};