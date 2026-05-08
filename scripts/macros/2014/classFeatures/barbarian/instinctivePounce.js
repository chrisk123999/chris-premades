import {animationUtils, crosshairUtils, effectUtils, itemUtils} from '../../../../utils.js';
async function use({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let canPlay = animationUtils.sequencerCheck() && animationUtils.aseCheck();
    let maxRange = Math.floor(0.1 * workflow.actor.system.attributes.movement.speed) * 5;
    if (!maxRange) return;
    if (!playAnimation || !canPlay) {
        return await effectUtils.createEffect(workflow.actor, {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {turns: 1},
            changes: [
                {
                    key: 'system.attributes.movement.speed',
                    mode: 2,
                    value: maxRange,
                    priority: 20
                }
            ]
        }, {identifier: 'instinctivePounce'});
    }
    let position = await crosshairUtils.aimCrosshair({
        token: workflow.token, 
        maxRange, 
        centerpoint: workflow.token.center, 
        drawBoundries: true, 
        trackDistance: true, 
        fudgeDistance: workflow.token.document.width * canvas.dimensions.distance / 2,
        crosshairsConfig: {
            size:  workflow.token.document.parent.grid.distance * workflow.token.document.width / 2,
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
export let instinctivePounce = {
    name: 'Instinctive Pounce',
    version: '1.5.26',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 100
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
