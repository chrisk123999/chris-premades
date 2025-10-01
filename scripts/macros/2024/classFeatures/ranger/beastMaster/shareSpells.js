import {dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    let workflowItem = workflow.item;
    if (workflowItem.type !== 'spell') return;
    if (!workflow.targets.some(t => t.document.uuid === workflow.token.document.uuid)) return;
    let primalCompanion = itemUtils.getItemByIdentifier(workflow.actor, 'primalCompanion');
    if (!primalCompanion) return;
    let primalCompanionEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'primalCompanion');
    if (!primalCompanionEffect) return;
    let primalCompanionToken = workflow.token.document.parent.tokens.get(primalCompanionEffect.flags['chris-premades'].summons.ids[primalCompanion.name][0]);
    if (!primalCompanionToken) return;
    let range = itemUtils.getConfig(item, 'range');
    if (tokenUtils.getDistance(workflow.token, primalCompanionToken) > range) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.ShareSpells.Confirm', {spell: workflowItem.name, name: primalCompanionToken.actor.name}));
    if (!selection) return;
    let targets = Array.from(workflow.targets);
    targets.push(primalCompanionToken);
    workflowUtils.updateTargets(workflow, targets);
}
export let shareSpells  = {
    name: 'Share Spells',
    version: '1.3.79',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 30,
            category: 'homebrew'
        }
    ]
};