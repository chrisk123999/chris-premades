import {dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';

function getDamageTypes(item) {
    let activities = Array.from(item.system.activities.getByTypes('attack', 'damage', 'save'));
    let flavorTypes = new Set(activities.flatMap(a => a.damage.parts.flatMap(d => new Roll(d.formula).terms.map(i => i.flavor).filter(i => i))));
    let trueTypes = new Set(activities.flatMap(a => a.damage.parts.flatMap(d => Array.from(d.types))));
    let allTypes = flavorTypes.union(trueTypes);
    return allTypes;
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    if (workflow.item.type !== 'spell') {
        if (workflow.item.type !== 'feat') return;
        if (!workflow.item.flags?.['chris-premades']?.castData?.castLevel) return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow) ?? workflow.item.flags?.['chris-premades']?.castData?.castLevel;
    if (!spellLevel) return;
    let oldDamageRolls = workflow.damageRolls;
    if (!oldDamageRolls?.length) return;
    let oldDamageTypes = workflowUtils.getDamageTypes(oldDamageRolls);
    let validSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.level === spellLevel && Array.from(i.system.activities.getByTypes('attack', 'damage', 'save')).length);
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
        values = values.union(getDamageTypes(spell));
    }
    values = values.difference(new Set(['healing', 'temphp', 'none', 'midi-none']));
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
    version: '1.1.0',
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