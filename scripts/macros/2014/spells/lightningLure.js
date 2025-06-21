import {animationUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow, ditem}) {
    if (workflow.targets.size !== 1) return;
    let targetToken = workflow.targets.first();
    let sourceToken = workflow.token;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.aseCheck();
    let distance = tokenUtils.getDistance(sourceToken, targetToken);
    let pullDistance = 0;
    if (workflow.failedSaves.size) {
        pullDistance = Math.min(10, ((distance - 1) - ((distance - 1) % 5)));
    }
    if (!playAnimation) {
        if (workflow.failedSaves.size) {
            await tokenUtils.pushToken(sourceToken, targetToken, -pullDistance);
            await targetToken.animationContexts?.get('Token.' + targetToken.id + '.animate')?.promise ?? true;
        }
    } else {
        let dirRay = new Ray(targetToken.center, sourceToken.center);
        let distPer = dirRay.distance / distance;
        let position = canvas.grid.getTopLeftPoint(dirRay.project((distPer * pullDistance) / dirRay.distance));
        if (!workflow.failedSaves.size) position = targetToken.position;
        if (isNaN(position?.x)) position = targetToken.position;
        let seq = new Sequence();
        if (targetToken !== sourceToken) {
            seq = seq
                .effect()
                .atLocation(sourceToken)
                .file('animated-spell-effects-cartoon.electricity.discharge.03')
                .stretchTo(targetToken, {'attachTo': true})
                .delay(0)
                .filter('ColorMatrix', {'saturate':1, 'hue': 25})
                .scaleIn(0, 750, {'ease': 'easeOutQuint'})
                .repeats(2, 600, 600)
        
                .wait(250);
        }
        await seq
            .effect()
            .file('animated-spell-effects-cartoon.electricity.25')
            .atLocation(targetToken)
            .scaleToObject(2)
            .playbackRate(1)
            .spriteRotation(90)
            .mirrorX()
            .filter('ColorMatrix', {'saturate': 1, 'hue': -15})
            .moveTowards({'x': position.x + (canvas.grid.size * targetToken.document.width) / 2, 'y': position.y + (canvas.grid.size * targetToken.document.height) / 2}, {'ease': 'easeInOutBack', 'rotate': false})
            .zIndex(2)

            .animation()
            .on(targetToken)
            .opacity(0)

            .animation()
            .on(targetToken)
            .moveTowards({'x': position.x, 'y': position.y})
            .opacity(0)
            .delay(250)

            .effect()
            .from(targetToken)
            .atLocation(targetToken)
            .moveTowards({'x': position.x + (canvas.grid.size * targetToken.document.width) / 2, 'y': position.y + (canvas.grid.size * targetToken.document.height) / 2 }, {'ease': 'easeInOutBack', 'rotate': false})
            .zIndex(0.1)
            .scaleToObject(1)
            .extraEndDuration(500)
            .waitUntilFinished(-300)

            .animation()
            .on(targetToken)
            .fadeIn(250)
            .opacity(1)

            .effect()
            .from(targetToken)
            .atLocation(targetToken)
            .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 75, 'pingPong': true, 'gridUnits': true})
            .scaleToObject(targetToken.document.texture.scaleX)
            .delay(250)
            .opacity(0.5)
            .playIf(() => {
                let distanceToTargetX = Math.abs(sourceToken.x - position.x);
                let distanceToTargetY = Math.abs(sourceToken.y - position.y);
                return distanceToTargetX <= canvas.grid.size && distanceToTargetY <= canvas.grid.size;
            })

            .effect()
            .file('animated-spell-effects-cartoon.electricity.19')
            .atLocation(sourceToken)
            .scaleToObject(2)
            .rotateTowards(targetToken)
            .filter('ColorMatrix', {'saturate':1, 'hue': -15 })
            .zIndex(0.2)
            .playIf(() => {
                let distanceToTargetX = Math.abs(sourceToken.x - position.x);
                let distanceToTargetY = Math.abs(sourceToken.y - position.y);
                return distanceToTargetX <= canvas.grid.size && distanceToTargetY <= canvas.grid.size;
            })

            .play();
    }
    let finalDistance = tokenUtils.getDistance(sourceToken, targetToken);
    if (finalDistance > genericUtils.handleMetric(5)) {
        workflowUtils.negateDamageItemDamage(ditem);
    }
}
export let lightningLure = {
    name: 'Lightning Lure',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'applyDamage',
                macro: damage,
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