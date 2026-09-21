import {automationUtils, constants, dialogUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({document, workflow}) {
    if (!workflow.targets.size || workflow.item.type !== 'spell' || !workflow.item.system.level) return;
    const damageTypes = automationUtils.getConfigValue(document, 'damageTypes');
    if (!damageTypes.length || !itemUtils.getItemDamageTypes(workflow.item).intersects(new Set(damageTypes))) return;
    await workflowUtils.completeItemUse(document);
}
async function damage({document, workflow}) {
    if (!workflow.targets.size || !workflow.damageRolls?.length) return;
    const damageTypes = automationUtils.getConfigValue(document, 'damageTypes');
    if (!damageTypes.length) return;
    const damageType = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType') || damageTypes[0];
    const damageRolls = await Promise.all(workflow.damageRolls.map(async roll => await rollUtils.getChangedDamageRoll(roll, damageType)));
    await workflow.setDamageRolls(damageRolls);
}
export const heartOfTheStorm = {
    name: 'Heart of the Storm',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorPreambleComplete', macro: early, priority: 50},
        {pass: 'itemDamageRoll', macro: damage, priority: 50}
    ],
    config: {
        damageTypes: {
            default: ['lightning', 'thunder'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
