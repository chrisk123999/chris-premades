import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function resist({document: item, ditem}) {
    if (!ditem.isHit || ditem.totalDamage <= 0 || !item.system.uses.value) return;
    const actor = item.actor;
    if (actorUtils.hasUsedReaction(actor) || actor.statuses.has('incapacitated')) return;
    const typeTotal = type => ditem.calculatedDamages.filter(detail => detail.type === type).reduce((total, detail) => total + detail.value, 0);
    const types = automationUtils.getConfigValue(item, 'damageTypes').filter(type => typeTotal(type) > 1 && !actorUtils.checkTrait(actor, 'dr', type) && !actorUtils.checkTrait(actor, 'di', type));
    if (!types.length) return;
    const userId = queryUtils.firstOwner(actor, true);
    const type = types.length > 1
        ? await dialogUtils.selectDamageType(types, item.name, 'CHRISPREMADES.Generic.SelectDamageType', {addNo: true, userId})
        : await dialogUtils.confirmUseItem(item, {userId}) && types[0];
    if (!type) return;
    const activity = itemUtils.getActivityByIdentifier(item, type);
    if (activity) await workflowUtils.completeActivityUse(activity, [], {fast: true});
    else {
        await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
        await actorUtils.setReactionUsed(actor);
    }
    const total = typeTotal(type);
    workflowUtils.modifyDamageAppliedFlat(ditem, Math.floor(total / 2) - total, {type});
}
export const reactiveResistance = {
    name: 'Gift of the Chromatic Dragon: Reactive Resistance',
    version: '2.1.9',
    rules: '2014',
    config: {
        damageTypes: {
            default: ['acid', 'cold', 'fire', 'lightning', 'poison'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions; }
        }
    },
    roll: [
        {
            pass: 'targetDamagePercentReductions',
            macro: resist,
            priority: 50
        }
    ]
};
