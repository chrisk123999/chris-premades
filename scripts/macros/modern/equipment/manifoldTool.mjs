import {constants, dialogUtils, documentUtils, itemUtils} from '../../../proxy.mjs';
async function transform({workflow}) {
    if (workflow.activity.identifier !== 'transform') return;
    const check = itemUtils.getActivityByIdentifier(workflow.item, 'tool-check');
    if (!check) return;
    const artisanTools = constants.toolOptions.filter(option => option.type === 'art');
    const buttons = artisanTools.map(option => [option.label, option.value, {image: option.image}]);
    const selected = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Modern.ManifoldTool.Select', buttons);
    if (!selected) return;
    await documentUtils.update(check, {
        name: artisanTools.find(option => option.value === selected).label,
        'check.associated': [selected],
        'check.ability': CONFIG.DND5E.tools[selected].ability
    });
}
export const manifoldTool = {
    name: 'Manifold Tool',
    version: '2.1.8',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: transform,
            priority: 50
        }
    ]
};
