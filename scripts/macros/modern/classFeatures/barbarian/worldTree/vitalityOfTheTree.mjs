import {dialogUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function worldTreeRage({document: activity, data, macroClass: {identifier, source}}) {
    const tempHPActivity = itemUtils.getActivityByIdentifier(activity.item, 'life-giving-force');
    if (!tempHPActivity) return Logging.addMacroWarning(source, identifier, `Vitality of the Tree could not fetch its Life-Giving Force activity by identifier. (uuid) ${activity.item.uuid} (identifier) life-giving-force`);
    genericUtils.setProperty(data.effectData, `flags.${source}.lifeGivingForce`, tempHPActivity.uuid);
    const macro = {source, rules: vitalityOfTheTree.rules, identifier: 'lifeGivingForce'};
    if (data.effectData.flags.cat?.macros?.combat)
        data.effectData.flags.cat.macros.combat.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.combat', [macro]);
}
async function vitalitySurge({document: activity, token}) {
    await workflowUtils.syntheticActivityRoll(activity, [token]);
}
async function tempHP({document: effect, macroClass: {identifier, source}, token}) {
    const activity = await fromUuid(effect.flags[source]?.lifeGivingForce);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Life-Giving Force could not fetch its heal activity. (uuid) ${effect.flags[source]?.liveGivingForce}`);
    const near = tokenUtils.findNearby(token, activity.range.value || 10, {disposition: 'ally'});
    if (!near.length) return Logging.addMacroWarning(source, identifier, `Vitality of the Tree exited early with no available targets. (range) ${activity.range.value || 10}`);
    let target;
    const userId = queryUtils.firstOwner(token.actor, true);
    if (near.length === 1) target = near[0];
    else {
        const tags = near.reduce((obj, t) => {
            const amount = t.actor.system.attributes.hp.temp;
            if (amount > 0) obj[t.id] = [{
                label: _loc('CHRISPREMADES.Macros.Modern.VitalityOfTheTree.Tag', {amount}),
                tooltip: CONFIG.DND5E.healingTypes.temphp.label,
                image: CONFIG.DND5E.healingTypes.temphp.icon,
                id: 'temphp'
            }];
            return obj;
        }, {});
        const choice = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.VitalityOfTheTree.Prompt', near, {
            skipDeadAndUnconscious: false,
            requireTotal: true,
            userId,
            tags
        });
        if (!choice?.result) return Logging.addMacroWarning(source, identifier, 'Vitality of the Tree exited early due to a declined target prompt.');
        target = choice.result;
    }
    await workflowUtils.syntheticActivityRoll(activity, [target], {userId});
}
export const vitalityOfTheTree = {
    name: 'Vitality of the Tree',
    version: '2.1.3',
    rules: '2024',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: worldTreeRage,
            priority: 200
        },
        {
            pass: 'actorRageBegin',
            macro: vitalitySurge,
            priority: 200
        }
    ]
};
export const lifeGivingForce = {
    version: vitalityOfTheTree.version,
    rules: vitalityOfTheTree.rules,
    combat: [
        {
            pass: 'actorTurnStart',
            macro: tempHP,
            priority: 200
        }
    ]
};
