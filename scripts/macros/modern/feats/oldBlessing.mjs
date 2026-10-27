import utils from '../../../utils.mjs';
import {automationUtils, genericUtils, workflowUtils} from '../../../proxy.mjs';
async function filterTargets({document: activity, workflow}) {
    if (!workflow.targets.size) return;
    const charms = automationUtils.getConfigValue(activity.item, 'charms');
    const invalid = Array.from(workflow.targets).filter(target => !utils.carriesCharm(target.actor, workflow.actor, charms));
    if (!invalid.length) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.OldBlessing.NoCharm', {type: 'warn', format: {names: invalid.map(target => target.name).join(', ')}});
    await workflowUtils.removeTargets(workflow, invalid);
}
export const oldBlessing = {
    name: 'Old Blessing',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'castEnchantmentPreambleComplete',
            macro: filterTargets,
            priority: 40
        }
    ],
    config: {
        charms: {
            default: ['wickerToken', 'twistedHex', 'soulboundPoppet'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Modern.OldBlessing.Charms',
            category: 'homebrew',
            options: [
                {value: 'wickerToken', label: 'CHRISPREMADES.Macros.Modern.WickerToken.Token'},
                {value: 'twistedHex', label: 'CHRISPREMADES.Macros.Modern.TwistedHex.Charm'},
                {value: 'soulboundPoppet', label: 'CHRISPREMADES.Macros.Modern.OldBlessing.Poppet'}
            ]
        }
    }
};
