import {Summons} from '../../lib/summons.js';
import {activityUtils, animationUtils, compendiumUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let zombieActorName = itemUtils.getConfig(workflow.item, 'zombieActorName');
    let skeletonActorName = itemUtils.getConfig(workflow.item, 'skeletonActorName');

    let zombieActor = await compendiumUtils.getActorFromCompendium(monsterCompendium, zombieActorName);
    let skeletonActor = await compendiumUtils.getActorFromCompendium(monsterCompendium, skeletonActorName);
    if (!zombieActor) zombieActor = game.actors.getName(zombieActorName);
    if (!skeletonActor) skeletonActor = game.actors.getName(skeletonActorName);
    if (!zombieActor || !skeletonActor) {
        genericUtils.notify('CHRISPREMADES.Error.ActorNotFound', 'warn');
        return;
    }
    let totalSummons = 5 + ((workflow.castData?.castLevel ?? 5) - 5) * 2;
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
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'danseMacabreCommandUndead', {strict: true});
    if (!feature) return;
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        duration: 3600, 
        range: 10, 
        animation, 
        initiativeType: 'group', 
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name,
            identifier: 'danseMacabre', 
            activityIdentifier: 'danseMacabreCommandUndead'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['danseMacabreCommandUndead'],
            favorite: true
        }
    });
}
async function early({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'danseMacabreCommandUndead') return;
    workflowUtils.skipDialog(workflow);
}
export let danseMacabre = {
    name: 'Danse Macabre',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preTargeting',
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
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'zombieActorName',
            label: 'CHRISPREMADES.Summons.ActorName',
            i18nOption: 'Zombie',
            type: 'text',
            default: 'Zombie',
            category: 'summons'
        },
        {
            value: 'skeletonActorName',
            label: 'CHRISPREMADES.Summons.ActorName',
            i18nOption: 'Skeleton',
            type: 'text',
            default: 'Skeleton',
            category: 'summons'
        }
    ]
};