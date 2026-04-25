import {martialArts} from '../martialArts.js';
import {activityUtils, constants, dialogUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger: {entity: item}, workflow}) {
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let dice = item.parent.system.scale[classIdentifier]?.[scaleIdentifier]?.faces;
    if (!dice) return;
    let options = itemUtils.getConfig(item, 'damageTypes');
    let damageType = await dialogUtils.selectDamageType(options, item.name, 'CHRISPREMADES.Dialog.DamageType');
    if (!damageType) return;
    let activityData = activityUtils.withChangedDamage(workflow.activity, '3d' + dice, [damageType]);
    workflow.item = itemUtils.cloneItem(workflow.item, {
        ['system.activities.' + workflow.activity.id]: activityData
    });
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'monksFocus');
}
export let elementalBurst = {
    name: 'Elemental Burst',
    version: '1.5.22',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'monk',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'martial-arts',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: martialArts.scales
};
