import {Teleport} from '../../../lib/teleport.js';
import {activityUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let seasonItem = itemUtils.getItemByIdentifier(workflow.actor, 'changeSeason');
    let animation = (itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck()) ? 'mistyStep' : 'none';
    if (seasonItem) {
        let currSeason = seasonItem.flags['chris-premades']?.eladrin?.season ?? 'autumn';
        let feature;
        if (workflow.actor.system.details.level >= 3) {
            feature = await activityUtils.getActivityByIdentifier(workflow.item, 'feyStep' + currSeason.capitalize(), {strict: true});
            if (!feature) return;
        }
        switch (currSeason) {
            case 'autumn': {
                await Teleport.target(workflow.token, workflow.token, {
                    animation,
                    range: 30
                });
                if (!feature) return;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 10, 'enemy').filter(i => tokenUtils.canSee(workflow.token, i));
                if (!nearbyTargets.length) return;
                if (nearbyTargets.length > 2) {
                    nearbyTargets = await dialogUtils.selectTargetDialog(feature.name, genericUtils.format('CHRISPREMADES.Macros.FeyStep.SelectAutumn', {max: 2}), nearbyTargets, {
                        type: 'multiple',
                        maxAmount: 2
                    });
                    if (!nearbyTargets?.length) return;
                    nearbyTargets = nearbyTargets[0];
                }
                let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, nearbyTargets);
                if (!featureWorkflow.failedSaves.size) return;
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Charmed'),
                    img: feature.img,
                    duration: {
                        seconds: 60
                    },
                    origin: workflow.item.uuid,
                    flags: {
                        'chris-premades': {
                            conditions: ['charmed']
                        },
                        dae: {
                            specialDuration: ['isDamaged']
                        }
                    }
                };
                for (let token of featureWorkflow.failedSaves) {
                    await effectUtils.createEffect(token.actor, effectData);
                }
                return;
            }
            case 'winter': {
                if (!feature) break;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => tokenUtils.canSee(workflow.token, i));
                if (!nearbyTargets.length) break;
                let targetToken = nearbyTargets[0];
                if (nearbyTargets.length > 1) {
                    targetToken = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.FeyStep.SelectWinter', nearbyTargets);
                    if (!targetToken) break;
                    targetToken = targetToken[0];
                }
                let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
                if (!featureWorkflow.failedSaves.size) break;
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Frightened'),
                    img: feature.img,
                    origin: workflow.item.uuid,
                    flags: {
                        'chris-premades': {
                            conditions: ['frightened']
                        },
                        dae: {
                            showIcon: true,
                            specialDuration: ['turnEndSource']
                        }
                    }
                };
                await effectUtils.createEffect(targetToken.actor, effectData);
                break;
            }
            case 'spring': {
                if (!feature) break;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'ally', {includeIncapacitated: false, includeToken: true});
                if (nearbyTargets.length === 1) break;
                let selection = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.FeyStep.SelectSpring', nearbyTargets);
                if (!selection) break;
                selection = selection[0];
                await workflowUtils.syntheticActivityRoll(feature, [selection]);
                await Teleport.target(selection, workflow.token, {
                    animation,
                    range: 30
                });
                return;
            }
            case 'summer': {
                await Teleport.target(workflow.token, workflow.token, {
                    animation,
                    range: 30
                });
                if (!feature) return;
                await workflowUtils.syntheticActivityRoll(feature);
                return;
            }
        }
    }
    await Teleport.target(workflow.token, workflow.token, {
        animation,
        range: 30
    });
}
export let eladrinFeyStep = {
    name: 'Fey Step',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['eladrinFeyStep']
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
        }
    ]
};