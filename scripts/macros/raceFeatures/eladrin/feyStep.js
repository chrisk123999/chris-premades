import {Teleport} from '../../../lib/teleport.js';
import {animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let seasonItem = itemUtils.getItemByIdentifier(workflow.actor, 'changeSeason');
    let animation = (itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck()) ? 'mistyStep' : 'none';
    if (seasonItem) {
        let currSeason = seasonItem.flags['chris-premades']?.eladrin?.season ?? 'autumn';
        let featureData;
        if (workflow.actor.system.details.level >= 3) {
            featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.raceFeatureItems, 'Fey Step (' + currSeason.capitalize() + ')', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FeyStep.' + currSeason.capitalize()});
            if (!featureData) {
                errors.missingPackItem();
                return;
            }
            if (['autumn', 'winter'].includes(currSeason)) {
                featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
            }
        }
        switch (currSeason) {
            case 'autumn': {
                await Teleport.target(workflow.token, workflow.token, {
                    animation,
                    range: 30
                });
                if (!featureData) return;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 10, 'enemy').filter(i => tokenUtils.canSee(workflow.token, i));
                if (!nearbyTargets.length) return;
                if (nearbyTargets.length > 2) {
                    nearbyTargets = await dialogUtils.selectTargetDialog(featureData.name, genericUtils.format('CHRISPREMADES.Macros.FeyStep.SelectAutumn', {max: 2}), nearbyTargets, {
                        type: 'multiple',
                        maxAmount: 2
                    });
                    if (!nearbyTargets?.length) return;
                    nearbyTargets = nearbyTargets[0];
                }
                let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, nearbyTargets, {killAnim: true});
                if (!featureWorkflow.failedSaves.size) return;
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Charmed'),
                    img: featureData.img,
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
                if (!featureData) break;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => tokenUtils.canSee(workflow.token, i));
                if (!nearbyTargets.length) break;
                let targetToken = nearbyTargets[0];
                if (nearbyTargets.length > 1) {
                    targetToken = await dialogUtils.selectTargetDialog(featureData.name, 'CHRISPREMADES.Macros.FeyStep.SelectWinter', nearbyTargets);
                    if (!targetToken) break;
                    targetToken = targetToken[0];
                }
                let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken], {killAnim: true});
                if (!featureWorkflow.failedSaves.size) break;
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Frightened'),
                    img: featureData.img,
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
                if (!featureData) break;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'ally', {includeIncapacitated: false, includeToken: true});
                if (nearbyTargets.length === 1) break;
                let selection = await dialogUtils.selectTargetDialog(featureData.name, 'CHRISPREMADES.Macros.FeyStep.SelectSpring', nearbyTargets);
                if (!selection) break;
                selection = selection[0];
                await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [selection], {killAnim: true});
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
                if (!featureData) return;
                await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [], {killAnim: true});
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
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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