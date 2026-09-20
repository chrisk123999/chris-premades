import {automationUtils, dialogUtils, documentUtils, DamageBonus} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const names = new Set();
    const spells = workflow.actor.itemTypes.spell.filter(spell => {
        if (spell.system.level !== 0 || names.has(spell.name)) return false;
        names.add(spell.name);
        return true;
    });
    if (!spells.length) return;
    const max = automationUtils.getConfigValue(document, 'max');
    const selection = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.AgonizingBlast.Select'), spells, {max, sort: 'alphabetical', checkbox: true});
    if (!selection) return;
    const chosen = Array.isArray(selection) ? selection.map(entry => entry.document ?? entry) : [selection];
    await documentUtils.setFlag(document, 'chris-premades', 'agonizingBlast.spells', chosen.map(spell => spell.name));
}
function damage({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    const name = workflow.item.type === 'spell' ? workflow.item.name : workflow.item.flags['chris-premades']?.bladeCantrip;
    if (!name) return;
    const spellNames = document.flags['chris-premades']?.agonizingBlast?.spells;
    if (!spellNames?.includes(name)) return;
    return new DamageBonus(document, {formula: automationUtils.getConfigValue(document, 'formula'), optional: false, allowCritical: false, type: workflow.defaultDamageType});
}
export const agonizingBlast = {
    name: 'Eldritch Invocations: Agonizing Blast',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: damage, priority: 100}
    ],
    config: {
        max: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Config.Max',
            category: 'mechanics'
        },
        formula: {
            default: '@abilities.cha.mod',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
