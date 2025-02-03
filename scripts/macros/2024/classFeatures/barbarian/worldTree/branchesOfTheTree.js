import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function early({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (effect) return;
    genericUtils.notify('CHRISPREMADES.Macros.BranchesOfTheTree.Rage');
    workflow.aborted = true;
}
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    if (animationUtils.jb2aCheck() === 'free' && animation != 'none') animation = 'mistyStep'; 
    let range = Number(itemUtils.getConfig(workflow.item, 'range'));
    if (isNaN(range)) range = 5;
    await Teleport.target(workflow.failedSaves.first(), workflow.token, {animation, range});
    if (workflow.token.document.disposition === workflow.failedSaves.first().document.disposition) return;
    let effect = workflow.item.effects.contents?.[0];
    if (!effect) return;
    let effectData = genericUtils.duplicate(effect.toObject());
    delete effectData._id;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    await effectUtils.createEffect(workflow.failedSaves.first().actor, effectData);
}
export let branchesOfTheTree = {
    name: 'Branches of the Tree',
    version: '1.1.26',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
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
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'text',
            default: 5,
            category: 'homebrew',
            homebrew: true
        }
    ]
};