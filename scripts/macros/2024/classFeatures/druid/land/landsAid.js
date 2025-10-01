import {activityUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let friendlyTargets = workflow['chris-premades']?.friendlyTargets;
    if (!friendlyTargets?.size) return;
    let selection;
    if (friendlyTargets.size === 1) {
        selection = friendlyTargets.first();
    } else {
        selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.LandsAid.Select', Array.from(friendlyTargets), {skipDeadAndUnconscious: false});
        if (!selection) return;
        selection = selection[0];
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'landsAidHeal', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [selection]);
}
async function early({workflow}) {
    let friendlyTargets = workflow.targets.filter(i => i.document.disposition === workflow.token.document.disposition);
    workflow.targets = workflow.targets.filter(i => !friendlyTargets.has(i));
    workflow['chris-premades'] ??= {};
    workflow['chris-premades'].friendlyTargets = friendlyTargets;
    genericUtils.updateTargets(workflow.targets);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['landsAid'], 'wildShape');
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (!item.actor.system.scale[subclassIdentifier]?.[scaleIdentifier]) {
        await itemUtils.fixScales(item);
    }
    if (subclassIdentifier === 'land' && scaleIdentifier === 'lands-aid') return;
    let newDamageString = `@scale.${subclassIdentifier}.${scaleIdentifier}`;
    let saveActivity = activityUtils.getActivityByIdentifier(item, 'landsAid', {strict: true});
    if (!saveActivity) return;
    let saveDamPart = saveActivity.damage.parts[0]?.toObject();
    if (saveDamPart?.custom?.formula === '@scale.land.lands-aid') {
        saveDamPart.custom.formula = newDamageString;
        await genericUtils.update(saveActivity, {'damage.parts': [saveDamPart]});
    }
    let healActivity = activityUtils.getActivityByIdentifier(item, 'landsAidHeal', {strict: true});
    if (!healActivity) return;
    let healDamPart = healActivity.healing?.toObject();
    if (healDamPart?.custom?.formula === '@scale.land.lands-aid') {
        healDamPart.custom.formula = newDamageString;
        await genericUtils.update(healActivity, {healing: healDamPart});
    }
}
export let landsAid = {
    name: 'Land\'s Aid',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['landsAid']
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50,
                activities: ['landsAid']
            }
        ]
    },
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
            value: 'subclassIdentifier',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            type: 'text',
            default: 'land',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'lands-aid',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'subclassIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'lands-aid',
                    type: 'dice',
                    scale: {
                        3: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        10: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        14: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Land\'s Aid Damage',
                icon: null
            }
        }
    ]
};