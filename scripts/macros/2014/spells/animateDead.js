import {Summons} from '../../../lib/summons.js';
import {activityUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let zombieActorName = itemUtils.getConfig(workflow.item, 'zombieActorName');
    let skeletonActorName = itemUtils.getConfig(workflow.item, 'skeletonActorName');

    let zombieActor = await compendiumUtils.getActorFromCompendium(monsterCompendium, zombieActorName, {ignoreNotFound: true});
    let skeletonActor = await compendiumUtils.getActorFromCompendium(monsterCompendium, skeletonActorName, {ignoreNotFound: true});
    if (!zombieActor) zombieActor = game.actors.getName(zombieActorName);
    if (!skeletonActor) skeletonActor = game.actors.getName(skeletonActorName);
    if (!zombieActor || !skeletonActor) {
        genericUtils.notify('CHRISPREMADES.Error.ActorNotFound', 'warn');
        return;
    }
    let totalSummons = 1 + ((workflow.castData?.castLevel ?? 3) - 3) * 2;
    if (itemUtils.getItemByIdentifier(workflow.actor, 'undeadThralls')) totalSummons += 1;
    if (!totalSummons || totalSummons < 1) return;
    let sourceActors = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons}), [zombieActor, skeletonActor], {
        max: totalSummons
    });
    if (!sourceActors || !sourceActors.length || !sourceActors.reduce((acc, x) => acc += x.amount, 0)) return;
    let updates = {
        token: {
            disposition: workflow.token.document.disposition
        }
    };
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'shadow';
    if (animationUtils.jb2aCheck() !== 'patreon') animation = 'none';
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'animateDeadCommand', {strict: true});
    if (!feature) return;
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        duration: 86400, 
        range: 10, 
        animation, 
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'animateDead', 
            activityIdentifier: 'animateDeadCommand'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['animateDeadCommand'],
            favorite: true
        }
    });
}
async function early({dialog}) {
    dialog.configure = false;
}
export let animateDead = {
    name: 'Animate Dead',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['animateDead']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['animateDeadCommand']
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'zombieActorName',
            label: 'CHRISPREMADES.Summons.ActorName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Zombie',
            type: 'text',
            default: 'Zombie',
            category: 'summons'
        },
        {
            value: 'skeletonActorName',
            label: 'CHRISPREMADES.Summons.ActorName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Skeleton',
            type: 'text',
            default: 'Skeleton',
            category: 'summons'
        }
    ]
};