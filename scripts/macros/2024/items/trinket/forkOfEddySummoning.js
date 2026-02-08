import {Summons} from '../../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    if (!game.packs.get(monsterCompendium)) return;
    let actorName = itemUtils.getConfig(workflow.item, 'actorName');
    let actor = await compendiumUtils.getActorFromCompendium(monsterCompendium, actorName);
    if (!actor) return;
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let dismiss = activityUtils.getActivityByIdentifier(workflow.item, 'dismiss', {strict: true});
    if (!dismiss) return;
    let updates = {
        actor: {
            prototypeToken: {
                disposition: workflow.token.document.disposition
            }
        },
        token: {
            disposition: workflow.token.document.disposition
        }
    };
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (name) {
        updates.actor.name = name;
        updates.token.name = name;
        updates.actor.prototypeToken.name = name;
    }
    await Summons.spawn(actor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.activity).seconds, 
        range: workflow.activity.range.value,
        animation,
        initiativeType: 'follows',
        dismissActivity: dismiss,
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['dismiss'],
            favorite: true
        }
    });
}
async function dismiss({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'forkOfEddySummoning');
    if (effect) await genericUtils.remove(effect);
}
export let forkOfEddySummoning = {
    name: 'Fork of Eddy Summoning',
    version: '1.4.25',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summon']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['dismiss']
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'actorName',
            label: 'CHRISPREMADES.Summons.ActorName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.EldritchEddy',
            type: 'text',
            default: 'Eldritch Eddy',
            category: 'summons'
        },
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.EldritchEddy',
            type: 'text',
            default: '',
            category: 'summons'
        }
    ]
};