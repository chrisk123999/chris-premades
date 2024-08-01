import {Summons} from '../../lib/summons.js';
import {animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let zombieActorName = 'CPR - Zombie';
    let skeletonActorName = 'CPR - Skeleton';
    let zombieActor = game.actors.getName(zombieActorName);
    let skeletonActor = game.actors.getName(skeletonActorName);
    if (!zombieActor || !skeletonActor) {
        genericUtils.notify('CHRISPREMADES.error.actorNotFound', 'warn');
        return;
    }
    let totalSummons = 1 + ((workflow.castData?.castLevel ?? 3) - 3) * 2;
    if (itemUtils.getItemByIdentifer(workflow.actor, 'undeadThralls')) totalSummons += 1;
    if (!totalSummons || totalSummons < 1) return;
    let sourceActors = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.AnimateDead.Select', {totalSummons}), [zombieActor, skeletonActor], {
        max: totalSummons
    });
    if (!sourceActors || !sourceActors.length || !sourceActors.reduce((acc, x) => acc += x.amount, 0)) return;
    let updates = {
        token: {
            disposition: 1
        }
    };
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'shadow';
    if (animationUtils.jb2aCheck() !== 'patreon') animation = 'none';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Animate Dead: Command', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.AnimateDead.Command', identifier: 'animateDeadCommand'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {duration: 86400, range: 10, animation, additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'animateDeadCommand'}]});
    if (itemUtils.getItemByIdentifer(workflow.actor, 'animateDeadCommand')) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'animateDead');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), parentEntity: effect});
}
export let animateDead = {
    name: 'Animate Dead',
    version: '0.12.0',
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
            value: 'animation',
            label: 'CHRISPREMADES.config.animation',
            type: 'select',
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};