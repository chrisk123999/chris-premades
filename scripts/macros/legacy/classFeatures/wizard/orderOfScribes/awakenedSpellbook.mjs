import {actorUtils, automationUtils, combatUtils, constants, dialogUtils, documentUtils, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damage({document: item, workflow, token}) {
    if (!workflow.targets.size) return;
    const oncePerTurn = automationUtils.getConfigValue(item, 'oncePerTurn');
    const combatData = oncePerTurn ? tokenUtils.getCombatData(token) : undefined;
    const stamps = genericUtils.getProperty(item, 'flags.cat.awakenedSpellbook.stamps') ?? [];
    if (oncePerTurn && combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
    if (workflow.item.type !== 'spell') {
        if (workflow.item.type !== 'feat') return;
        if (!workflow.item.flags?.cat?.castData?.castLevel) return;
    }
    const spellLevel = workflowUtils.getCastLevel(workflow);
    if (!spellLevel) return;
    const oldDamageRolls = workflow.damageRolls;
    if (!oldDamageRolls?.length) return;
    const oldDamageTypes = workflowUtils.getDamageTypes(oldDamageRolls);
    const validSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.level === spellLevel && Array.from(i.system.activities.getByTypes('attack', 'damage', 'save')).length);
    let values = [];
    switch (spellLevel) {
        case 1: {
            const magicMissile = actorUtils.getItemByIdentifier(workflow.actor, 'magic-missile');
            if (magicMissile) values.push(automationUtils.getConfigValue(magicMissile, 'damageType') ?? 'force');
            if (actorUtils.getItemByIdentifier(workflow.actor, 'chromatic-orb')) values.push('acid', 'cold', 'fire', 'lightning', 'poison', 'thunder');
            break;
        }
        case 2:
            if (actorUtils.getItemByIdentifier(workflow.actor, 'dragons-breath')) values.push('acid', 'cold', 'fire', 'lightning', 'poison');
            break;
        case 3:
            if (actorUtils.getItemByIdentifier(workflow.actor, 'spirit-shroud')) values.push('cold', 'necrotic', 'radiant');
            if (actorUtils.getItemByIdentifier(workflow.actor, 'vampiric-touch')) values.push('necrotic');
            break;
        case 5:
            if (actorUtils.getItemByIdentifier(workflow.actor, 'cloudkill')) values.push('poison');
            break;
    }
    values.push(...(automationUtils.getConfigValue(item, 'extraDamageTypes') ?? []));
    values = new Set(values);
    for (const spell of validSpells) values = values.union(itemUtils.getItemDamageTypes(spell));
    values = values.difference(new Set(['healing', 'temphp', 'none', 'midi-none']));
    if (oldDamageTypes.size === 1) values = values.difference(oldDamageTypes);
    if (!values.size) return;
    const selection = await dialogUtils.selectDamageType(Array.from(values), item.name, 'CHRISPREMADES.Macros.Legacy.AwakenedSpellbook.Select', {addNo: true, sort: 'alphabetical'});
    if (!selection) return;
    const newRolls = [];
    for (const oldRoll of oldDamageRolls) newRolls.push(await rollUtils.getChangedDamageRoll(oldRoll, selection));
    await workflow.setDamageRolls(newRolls);
    if (oncePerTurn) await documentUtils.update(item, {'flags.cat.awakenedSpellbook.stamps': combatUtils.addTurnStamp(stamps, token.id, combatData)});
}
export const awakenedSpellbook = {
    name: 'Awakened Spellbook: Replace Damage',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 49
        }
    ],
    config: {
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.AwakenedSpellbook.OncePerTurn',
            category: 'mechanics'
        },
        extraDamageTypes: {
            default: [],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Legacy.AwakenedSpellbook.ExtraDamageTypes',
            category: 'damage',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
