import {activityUtils, constants, dialogUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.item) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (!constants.unarmedAttacks.includes(identifier)) return;
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier != 'punch') return;
    let autoApply = itemUtils.getConfig(item, 'autoApply');
    if (!autoApply) {
        let selection = await dialogUtils.confirmUseItem(item);
        if (!selection) return;
    }
    workflow.item = workflow.item.clone({'system.damage.base.types': ['force']}, {keepId: true});
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let empoweredStrikes = {
    name: 'Empowered Strikes',
    version: '1.3.141',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 40
            }
        ]
    },
    config: [
        {
            value: 'autoApply',
            label: 'CHRISPREMADES.Config.AutoApply',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ]
};