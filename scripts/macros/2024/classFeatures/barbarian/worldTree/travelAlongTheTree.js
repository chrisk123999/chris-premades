import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../../utils.js';
async function early({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (effect) return;
    genericUtils.notify('CHRISPREMADES.Macros.BranchesOfTheTree.Rage');
    workflow.aborted = true;
}
async function single({trigger, workflow}) {
    if (!workflow.token) return;
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    if (animationUtils.jb2aCheck() === 'free' && animation != 'none') animation = 'mistyStep';
    await Teleport.target(workflow.token, workflow.token, {animation, range: workflow.activity.range.value});
}
async function group({trigger, workflow}) {
    if (!workflow.token) return;
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    if (animationUtils.jb2aCheck() === 'free' && animation != 'none') animation = 'mistyStep';
    let targets = [workflow.token];
    if (workflow.targets.size) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.TravelAlongTheTree.WillingCreatures', Array.from(workflow.targets), {type: 'multiple', skipDeadAndUnconscious: false, maxAmount: 6});
        if (selection?.[0]) targets.push(...selection[0]);
    }
    await Teleport.group(targets, workflow.token, {animation, range: workflow.activity.range.value});
}
export let travelAlongTheTree = {
    name: 'Travel along the Tree',
    version: '1.1.27',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: single,
                priority: 50,
                activities: ['single']
            },
            {
                pass: 'rollFinished',
                macro: group,
                priority: 50,
                activities: ['group']
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'hiddenPaths',
            category: 'animation',
            options: constants.teleportOptions
        }
    ]
};