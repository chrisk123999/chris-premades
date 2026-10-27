import {actorUtils, activityUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../../proxy.mjs';
async function empower({document: item, workflow}) {
    if (workflow.activity.identifier !== 'bite') return;
    if (!item.system.uses.value || !workflow.token) return;
    const target = workflow.hitTargets.first();
    if (!target?.actor) return;
    if (automationUtils.getConfigValue(item, 'ignoredCreatureTypes').includes(actorUtils.typeOrRace(target.actor))) return;
    const damageTypes = new Set(workflow.activity.damage.parts.flatMap(part => Array.from(part.types)));
    const entry = workflow.damageList?.find(ditem => ditem.targetUuid === target.document.uuid);
    const dealt = Math.floor(entry?.damageDetail?.reduce((total, damage) => total + (damageTypes.has(damage.type) ? damage.value : 0), 0) ?? 0);
    if (dealt <= 0) return;
    const buttons = [
        ['CHRISPREMADES.Macros.Modern.VampiricBite.Drain', 'drain'],
        ['CHRISPREMADES.Macros.Modern.VampiricBite.Strengthen', 'strengthen'],
        ['COMMON.No', false]
    ];
    const selection = await dialogUtils.buttonDialog(item.name, _loc('CHRISPREMADES.Macros.Modern.VampiricBite.Empower', {damage: dealt}), buttons);
    if (!selection) return;
    const activity = itemUtils.getActivityByIdentifier(item, selection);
    if (!activity) return;
    if (selection === 'drain') {
        await workflowUtils.syntheticActivityDataRoll(activityUtils.getDamageModifiedActivityData(activity, dealt), item, [workflow.token.document]);
        return;
    }
    const strengthenWorkflow = await workflowUtils.completeActivityUse(activity, [workflow.token.document]);
    if (!strengthenWorkflow) return;
    const effect = documentUtils.getEffectByIdentifier(item, 'vampiricBiteStrengthen');
    if (!effect) return;
    const effectData = documentUtils.getEffectData(item, effect.id);
    effectData.system.changes.forEach(change => change.value = String(dealt));
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const vampiricBite = {
    name: 'Vampiric Bite',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: empower,
            priority: 50
        }
    ],
    config: {
        ignoredCreatureTypes: {
            default: ['construct', 'undead'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.IgnoredCreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        }
    }
};
