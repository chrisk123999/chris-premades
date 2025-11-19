import {constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

// Custom mapping for action names that don't match CONFIG.DND5E.rules slugification
const ACTION_RULE_MAPPING = {
    'Check Cover': 'cover',
    'Fall': 'falling',
    'Jump': 'jumping',
    'Knock Out': 'knockingacreatureout',
    'Squeeze': 'squeezing',
    'Stabilize': 'stabilizing',
    'Suffocation': 'suffocating',
    'Underwater': 'underwatercombat'
};

async function use({trigger, workflow}) {
    let rules = itemUtils.getConfig(workflow.item, 'rules');
    if (rules === 'system') rules = genericUtils.getRules(workflow.item);
    let packId = rules === 'modern' ? constants.modernPacks.actions : constants.packs.actions;
    let pack = game.packs.get(packId);
    if (!pack) return;
    let index = await pack.getIndex();
    let filter = ['Healing Surge'];
    let circleCast = genericUtils.getCPRSetting('circleCast');
    if (!circleCast) filter.push('Circle Cast');
    let documents = index.contents;
    documents = documents.filter(i => !filter.includes(i.name));
    // Add reference tooltips from CONFIG.DND5E.rules
    documents = documents.map(i => {
        let wrappedDoc = genericUtils.duplicate(i);
        // Check custom mapping first, then fall back to slugification
        const ruleKey = ACTION_RULE_MAPPING[i.name] ?? i.name.toLowerCase().replace(/\s+/g, '');
        const reference = CONFIG.DND5E.rules?.[ruleKey];
        if (reference) wrappedDoc.reference = reference;
        return wrappedDoc;
    });
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.GenericActions.Select', documents, {sortAlphabetical: true, displayReference: true});
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