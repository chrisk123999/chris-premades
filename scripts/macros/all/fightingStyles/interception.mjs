import {actorUtils, automationUtils, constants, dialogUtils, genericUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function intercept({ditem, targetToken, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (ditem.totalDamage <= 0) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const near = tokenUtils.findNearby(targetToken, 5, {disposition: 'ally'}).filter(t => {
        if (workflow.token.document.disposition === t.disposition) return;
        if (actorUtils.hasUsedReaction(t.actor)) return;
        if (workflow.targets.has(t.object)) return;
        if (!tokenUtils.canSee(t, workflow.token.document)) return;
        const feature = actorUtils.getItemByIdentifier(t.actor, 'interception') ?? actorUtils.getItemByIdentifier(t.actor, 'fighting-style-interception');
        if (!feature) return;
        const equipped = automationUtils.getConfigValue(feature, 'equipped') ?? [];
        if (!t.actor.items.some(i => i.system?.equipped && equipped.includes(i.system?.type?.value))) return;
        genericUtils.setProperty(t, 'chris-premades.interception', feature);
        return true;
    });
    if (!near.length) return;
    for (const t of near) {
        const feature = genericUtils.getProperty(t, 'chris-premades.interception');
        const userId = queryUtils.firstOwner(t.actor, true);
        if (!await dialogUtils.confirm(
            feature.name,
            _loc('CHRISPREMADES.Macros.All.Interception.Prompt', {item: feature.name, name: targetToken.name}),
            {userId}
        )) continue;
        const result = await workflowUtils.syntheticItemRoll(feature, [t], {userId});
        workflowUtils.modifyDamageAppliedFlat(ditem, -result.utilityRoll.total);
        if (ditem.totalDamage <= 0) return;
    }
}
export const interception = {
    name: 'Interception',
    rules: 'all',
    version: '2.0.3',
    roll: [ 
        {
            pass: 'sceneDamageFlatReductions',
            macro: intercept,
            priority: 600
        }
    ],
    config: {
        equipped: {
            default: ['martialM', 'martialR', 'simpleM', 'simpleR', 'shield'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.All.Interception.Equipped',
            hint: 'CHRISPREMADES.Macros.All.Interception.EquippedHint',
            category: 'behavior',
            get options() { return [
                {label: CONFIG.DND5E.armorTypes.shield, value: 'shield'},
                ...constants.weaponTypes()
            ]; }
        }
    }
};
