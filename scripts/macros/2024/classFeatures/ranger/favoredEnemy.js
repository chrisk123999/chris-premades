import {activityUtils, itemUtils, spellUtils} from '../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
    let huntersMark = await spellUtils.getCompendiumSpell('huntersMark', {identifier: true, rules: 'modern'});
    if (!huntersMark) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'huntersMark', {strict: true});
    if (!activity) return;
    await activityUtils.correctSpellLink(activity, huntersMark);
}
export let favoredEnemy = {
    name: 'Favored Enemy',
    version: '1.3.78',
    rules: 'modern',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'ranger',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'favored-enemy',
            category: 'homebrew',
            homebrew: true
        } 
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'favored-enemy',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        1: {
                            value: 2
                        },
                        5: {
                            value: 3
                        },
                        9: {
                            value: 4
                        },
                        13: {
                            value: 5
                        },
                        17: {
                            value: 6
                        }
                    }
                },
                value: {},
                title: 'Favored Enemy',
                hint: ''
            }
        }
    ]
};