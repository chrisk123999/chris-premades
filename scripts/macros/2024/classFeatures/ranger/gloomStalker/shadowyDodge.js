import {actorUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
import {Teleport} from '../../../../../lib/teleport.js';
import {teleportEffects} from '../../../../animations/teleportEffects.js';
async function attacked({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !workflowUtils.isAttackType(workflow, 'attack') || !workflow.token) return;
    let actor = item.actor;
    if (!actor) return;
    if (actorUtils.hasUsedReaction(actor)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.ShadowyDodge.Use', {item: item.name}));
    if (!selection) return;
    workflow.disadvantage = true;
    workflow.rollOptions.disadvantage = false;
    workflow.attackAdvAttribution.add('DIS: ' + item.name);
    genericUtils.setProperty(workflow, 'chris-premades.shadowyDodge', true)
}
async function rollFinished({trigger: {entity: item, token}, workflow}) {
    if (!workflow['chris-premades']?.shadowyDodge) return;
    let animation = itemUtils.getConfig(item, 'playAnimation') ? itemUtils.getConfig(item, 'animation') : 'none';
    let range = itemUtils.getConfig(item, 'range');
    await Teleport.target([token], token, {range, animation: animation});
}
export let shadowyDodge = {
    name: 'Shadowy Dodge',
    version: '1.3.81',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: attacked,
                priority: 50
            },
            {
                pass: 'targetRollFinished',
                macro: rollFinished,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            options: Object.entries(teleportEffects).map(([key, value]) => ({
                value: key, 
                label: value.name, 
                requiredModules: value.requiredModules ?? []
            })),
            category: 'animation'
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 30,
            homebrew: true,
            category: 'homebrew'
        }
    ]
}