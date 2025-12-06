import {dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';
async function save({trigger: {config, roll, actor, entity: item}}) {
    if (config['chris-premades']?.disciplinedSurvivor) return;
    let targetValue = roll.options.target;
    if (!targetValue) return;
    if (roll.total >= targetValue) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.FanaticalFocus.Use', {item: item.name, total: roll.total}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
    genericUtils.setProperty(config, 'chris-premades.disciplinedSurvivor', true);
    return await actor.rollSavingThrow(config, undefined, {create: false})[0];
}
export let disciplinedSurvivor = {
    name: 'Disciplined Survivor',
    version: '1.3.162',
    rules: 'modern',
    save: [
        {
            pass: 'bonus',
            macro: save,
            priority: 100
        }
    ]
};