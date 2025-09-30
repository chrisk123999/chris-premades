import {DialogApp} from '../../../applications/dialog.js';
import {activityUtils, animationUtils, crosshairUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    let secondStoryWork = itemUtils.getItemByIdentifier(workflow.actor, 'secondStoryWork');
    if (!secondStoryWork) return;
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    itemData.system.activities[workflow.activity.id].roll.formula = itemData.system.activities[workflow.activity.id].roll.formula.replaceAll('str', 'dex');
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function longJump({trigger, workflow}) {
    let selection = await DialogApp.dialog(workflow.item.name, undefined, [
        [
            'checkbox',
            [
                {
                    label: 'CHRISPREMADES.Macros.Jump.LongJump.LowObstacle',
                    name: 'lowObstacle'
                },
                {
                    label: 'CHRISPREMADES.Macros.Jump.LongJump.DifficultTerrain',
                    name: 'difficultTerrain'
                }
            ],
            {
                displayAsRows: true
            }
        ]
    ], 'okCancel');
    if (!selection?.buttons) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (selection.lowObstacle) {
        let activity = activityUtils.getActivityByIdentifier(workflow.item, 'lowObstacle');
        if (!activity) return;
        let lowObstacle = await workflowUtils.syntheticActivityRoll(activity, [workflow.token]);
        if (lowObstacle.failedSaves.size) playAnimation = false;
    }
    let addProne = false;
    if (selection.difficultTerrain) {
        let activity = activityUtils.getActivityByIdentifier(workflow.item, 'difficultTerrain');
        if (!activity) return;
        let difficultTerrain = await workflowUtils.syntheticActivityRoll(activity, [workflow.token]);
        if (difficultTerrain.failedSaves.size) addProne = true;
    }
    if (playAnimation) {
        let position = await crosshairUtils.aimCrosshair({
            token: workflow.token, 
            maxRange: genericUtils.convertDistance(workflow.utilityRolls[0].total), 
            centerpoint: workflow.token.center, 
            drawBoundries: true, 
            trackDistance: true, 
            fudgeDistance: workflow.token.document.width * canvas.dimensions.distance / 2,
            crosshairsConfig: {
                size: workflow.token.document.parent.grid.distance * workflow.token.document.width / 2,
                icon: workflow.token.document.texture.src,
                resolution: (workflow.token.document.width % 2) ? 1 : -1
            }
        });
        /* eslint-disable indent */
        await new Sequence()
            .animation()
                .on(workflow.token)
                .opacity(0)
                .waitUntilFinished(-100)
            .effect()
                .file('animated-spell-effects-cartoon.air.portal')
                .atLocation(workflow.token)
                .scaleToObject(1.75)
                .belowTokens()
            .effect()
                .copySprite(workflow.token)
                .atLocation(workflow.token)   
                .opacity(1)
                .duration(1000)
                .anchor({ x: 0.5, y: 1 })
                .loopProperty('sprite', 'position.y', {values: [50, 0, 50], duration: 500})
                .moveTowards(position, {rotate: false})
                .zIndex(2)
            .effect()
                .copySprite(workflow.token)
                .atLocation(workflow.token)   
                .opacity(0.5)
                .scale(0.9)
                .belowTokens()
                .duration(1000)
                .anchor({x: 0.5, y: 0.5})
                .filter('ColorMatrix', {brightness: -1})
                .filter('Blur', {blurX: 5, blurY: 10})
                .moveTowards(position, {rotate: false})
                .zIndex(2)
                .waitUntilFinished(-100)
            .animation()
                .on(workflow.token)
                .teleportTo(position)
                .snapToGrid()
                .opacity(1)
            .effect()
                .file('animated-spell-effects-cartoon.air.portal')
                .atLocation(position)
                .scaleToObject(1.75 * workflow.token.document.width)
                .belowTokens()

            .play();
        /* eslint-enable indent */
    }
    if (addProne) await effectUtils.applyConditions(workflow.actor, ['prone']);
}
export let jump = {
    name: 'Jump',
    version: '1.3.60',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: longJump,
                priority: 50,
                activities: ['longJump']
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50,
                activities: ['longJump', 'standingHighJump', 'runningHighJump']
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