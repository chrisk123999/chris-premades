import {constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let rules = itemUtils.getConfig(workflow.item, 'rules');
    if (rules === 'system') rules = genericUtils.getRules(workflow.item);
    let packId = rules === 'modern' ? constants.modernPacks.actions : constants.packs.actions;
    let pack = game.packs.get(packId);
    if (!pack) return;
    let index = await pack.getIndex();
    let circleCast = genericUtils.getCPRSetting('circleCast');
    if (!circleCast) index = index.filter(i => i.name != 'Circle Cast');
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.GenericActions.Select', index.contents, {sortAlphabetical: true});
    if (!selection) return;
    let documentData = genericUtils.duplicate(selection.toObject());
    documentData.system.description.value = itemUtils.getItemDescription(documentData.name);
    await workflowUtils.syntheticItemDataRoll(documentData, workflow.actor, Array.from(game.user.targets));
}
export let genericActions = {
    name: 'Generic Actions',
    version: '1.3.115',
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
            value: 'rules',
            label: 'CHRISPREMADES.Config.Rules',
            type: 'select',
            default: 'system',
            category: 'mechanics',
            options: [
                {
                    label: 'CHRISPREMADES.Macros.GenericActions.System',
                    value: 'system'
                },
                {
                    label: 'CHRISPREMADES.Macros.GenericActions.Legacy',
                    value: 'legacy'
                },
                {
                    label: 'CHRISPREMADES.Macros.GenericActions.Modern',
                    value: 'modern'
                }
            ]
        }
    ]
};