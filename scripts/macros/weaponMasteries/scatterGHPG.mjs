import {automationUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function hit({workflow, hit}) {
    const range = automationUtils.getGenericConfigValue(workflow.item, 'mastery', 'scatter(grimhollow)', 'range');
    const amount = Math.max(2, 1 + workflow.actor.system.abilities.dex.mod);
    const damageType = workflow.damageRolls?.[0]?.options.type ?? workflow.defaultDamageType;
    const struck = new Set(hit.map(token => token.document.id));
    const targets = new Set();
    for (const token of hit) tokenUtils.findNearby(token.document, range, {disposition: 'all', includeIncapacitated: true}).filter(nearby => !struck.has(nearby.id) && nearby.actor).forEach(nearby => targets.add(nearby));
    if (targets.size) await workflowUtils.applyDamage(Array.from(targets), amount, damageType);
}
export const scatterGHPGMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.ScatterGHPG.Label',
    macro: hit,
    genericConfig: {
        range: {default: 5, type: 'number', label: 'CHRISPREMADES.WeaponMasteries.ScatterGHPG.Range', category: 'mechanics'}
    }
};
