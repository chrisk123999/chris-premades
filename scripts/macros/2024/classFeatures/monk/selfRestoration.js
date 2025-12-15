import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let conditions = itemUtils.getConfig(workflow.item, 'conditions');
    let hasConditions = conditions.map(i => effectUtils.getEffectByStatusID(workflow.actor, i)).filter(i => i);
    if (!hasConditions.length) return;
    let selection;
    if (hasConditions.length === 1) {
        selection = hasConditions[0];
    } else {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectRemoveCondition', hasConditions, {sortAlphabetical: true});
        if (!selection) return;
    }
    await genericUtils.remove(selection);
}
export let selfRestoration = {
    name: 'Self-Restoration',
    version: '1.3.162',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'conditions',
            label: 'CHRISPREMADES.Config.Conditions',
            type: 'select-many',
            default: ['charmed', 'frightened', 'poisoned'],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};