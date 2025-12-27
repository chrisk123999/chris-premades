import {activityUtils, compendiumUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
import {dash} from '../actions/dash.js';
import {disengage} from '../actions/disengage.js';
async function create({trigger, workflow}) {
    let packId = genericUtils.getCPRSetting('itemCompendium');
    if (!game.packs.get(packId)) return;
    let identifier = activityUtils.getIdentifier(workflow.activity);
    let itemName = identifier === 'potion' ? 'Potion of Healing' : 'Antitoxin';
    let item = await compendiumUtils.getItemFromCompendium(packId, itemName, {object: true});
    if (!item) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampiresPlaythingDecanting');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [item], {parentEntity: effect});
    let otherActivityName = identifier === 'potion' ? 'antitoxin' : 'potion';
    let otherActivity = activityUtils.getActivityByIdentifier(workflow.item, otherActivityName, {strict: true});
    await genericUtils.update(otherActivity, {'uses.spent': otherActivity.uses.spent + 1});
}
export let vampiresPlaything = {
    name: 'Vampire\'s Plaything',
    version: '1.4.5',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: create,
                priority: 50,
                activities: ['potion', 'antitoxin']
            },
            {
                pass: 'rollFinished',
                macro: dash.midi.item[0].macro,
                priority: 50,
                activities: ['dash']
            },
            {
                pass: 'rollFinished',
                macro: disengage.midi.item[0].macro,
                priority: 50,
                activities: ['disengage']
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
            value: 'displayHint',
            label: 'CHRISPREMADES.Config.DisplayHint',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'cunningAction',
            category: 'animation',
            options: [
                {
                    value: 'stepOfTheWind',
                    label: 'CHRISPREMADES.Macros.Disengage.StepOfTheWind',
                    requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
                },
                {
                    value: 'cunningAction',
                    label: 'CHRISPREMADES.Macros.Disengage.CunningAction',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ],
    hasAnimation: true
};