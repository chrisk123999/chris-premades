import {activityUtils, constants, effectUtils, genericUtils, workflowUtils} from '../../utils.js';
import {findSteedEarlyHelper, findSteedHelper} from './findSteed.js';
async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier === genericUtils.getIdentifier(workflow.item)) {
        await findSteedHelper(workflow, 'Steed', 'Greater Steeds', 'findGreaterSteed');
    } else if (activityIdentifier === 'findSteedDismiss') {
        let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'findGreaterSteed');
        if (effect) await genericUtils.remove(effect);
    }
}
async function early({workflow}) {
    await findSteedEarlyHelper(workflow, 'findGreaterSteed');
}
async function veryEarly({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'findSteedDismiss') return;
    workflowUtils.skipDialog(workflow);
}
export let findGreaterSteed = {
    name: 'Find Greater Steed',
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
                macro: veryEarly,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'steedName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Steed',
            type: 'text',
            default: '',
            category: 'summons'

        },
        {
            value: 'folder',
            label: 'CHRISPREMADES.Summons.Folder',
            type: 'text',
            default: 'Greater Steeds',
            category: 'summons'
        },
        {
            value: 'celestialAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Celestial',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'feyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fey',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fiendAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fiend',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let findGreaterSteedActive ={
    name: 'Find Greater Steed: Active',
    version: findGreaterSteed.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 20
            }
        ]
    }
};