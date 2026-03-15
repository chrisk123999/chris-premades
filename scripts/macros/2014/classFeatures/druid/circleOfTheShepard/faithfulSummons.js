import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let pack = game.packs.get(monsterCompendium);
    if (!pack) return;
    let compendiumDocs = await compendiumUtils.getFilteredActorDocumentsFromCompendium(monsterCompendium, {maxCR: 2, actorTypes: ['npc'], creatureTypes: ['beast']});
    if (!compendiumDocs?.length) {
        genericUtils.notify('CHRISPREMADES.Summons.NoMatching', 'info');
        return;
    }
    let userId = socketUtils.gmID();
    if (genericUtils.getCPRSetting('playerSelectsConjures')) userId = game.user.id;
    if (!userId) return;
    let sourceDocs = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons: 4}), compendiumDocs, {max: 4, sortAlphabetical: true, sortCR: true, showCR: true, userId});
    if (sourceDocs?.length) sourceDocs = sourceDocs?.filter(i => i.amount);
    if (!sourceDocs?.length) return;
    let sourceActors = await Promise.all(sourceDocs.map(async i => {
        return {
            document: await fromUuid(i.document.uuid),
            amount: i.amount
        };
    }));
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let updates = {
        'actor.system.details.type.value': 'fey',
        token: {
            disposition: workflow.token.document.disposition
        }
    };
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.activity)?.seconds ?? 3600,
        range: workflow.rangeDetails?.range ?? 20,
        animation,
        initiativeType: 'group'
    });
}
async function targetedAfter({trigger: {entity: item, token}}) {
    if (!item.system.uses.value) return;
    if (token.actor.system.attributes.hp.value > 0 && !token.actor.statuses.has('incapacitated')) return;
    if (effectUtils.getEffectByIdentifier(token.actor, 'faithfulSummons')) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'activate', {strict: true});
    if (!activity) return;
    let userId = socketUtils.firstOwner(token.actor, true);
    let choice = await dialogUtils.confirmUseItem(item, {userId});
    if (!choice) return;
    await workflowUtils.syntheticActivityRoll(activity, [], {consumeUsage: true, consumeResources: true});
}
export let faithfulSummons = {
    name: 'Faithful Summons',
    version: '1.5.14',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'targetRollFinished',
                macro: targetedAfter,
                priority: 200
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};
