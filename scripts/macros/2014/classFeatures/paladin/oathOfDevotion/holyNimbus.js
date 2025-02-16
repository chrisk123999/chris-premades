import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function save({trigger}) {
    return {label: 'CHRISPREMADES.Macros.HolyNimbus.Save', type: 'advantage'};
}
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 60,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 30,
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'combat', ['holyNimbusActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'holyNimbus'});
}
async function turnStart({trigger: {entity: effect, target}}) {
    let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'holyNimbusDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [target]);
}
export let holyNimbus = {
    name: 'Holy Nimbus',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['holyNimbus']
            }
        ]
    },
    save: [
        {
            pass: 'context',
            macro: save,
            priority: 50
        }
    ]
};
export let holyNimbusActive = {
    name: 'Holy Nimbus: Active',
    version: holyNimbus.version,
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            distance: 30,
            disposition: 'enemy'
        }
    ]
};