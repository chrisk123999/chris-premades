import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function lightningLure({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'lightningLure', 50);
    if (!queueSetup) return;
    let target = workflow.targets.first();
    let sourceToken = workflow.token;
    let useAnimation = chris.getConfiguration(workflow.item, 'animation') ?? chris.aseCheck();
    let mDistance = chris.getDistance(workflow.token, target);
    console.log(mDistance);
    let pullDistance = 0;
    if (workflow.failedSaves.size) {
        if (mDistance >= 0 && mDistance <= 5) {
            pullDistance = 0;
        } else if (mDistance > 5 && mDistance <= 10) {
            pullDistance = -5;
        } else {
            pullDistance = -10;
        }
    }
    if (!useAnimation && workflow.failedSaves.size) {
        await chris.pushToken(sourceToken, target, pullDistance);
    } else if (!useAnimation && !workflow.failedSaves.size) {
        queue.remove(workflow.item.uuid);
        return;
    } else {
        let position = chris.getGridBetweenTokens(sourceToken, target, pullDistance);
        new Sequence()
            .effect()
            .atLocation(sourceToken)
            .file('animated-spell-effects-cartoon.electricity.discharge.03')
            .stretchTo(target, {'attachTo': true})
            .delay(0)
            .filter('ColorMatrix', {'saturate':1, 'hue': 25})
            .scaleIn(0, 750, {'ease': 'easeOutQuint'})
            .repeats(2, 600, 600)

            .wait(250)

            .effect()
            .file('animated-spell-effects-cartoon.electricity.25')
            .atLocation(target)
            .scaleToObject(2 * target.document.width)
            .playbackRate(1)
            .spriteRotation(90)
            .mirrorX()
            .filter('ColorMatrix', {'saturate': 1, 'hue': -15})
            .moveTowards({'x': position.x + (canvas.grid.size * target.document.width) / 2, 'y': position.y + (canvas.grid.size * target.document.height) / 2}, {'ease': 'easeInOutBack', 'rotate': false})
            .zIndex(2)

            .animation()
            .on(target)
            .opacity(0)

            .animation()
            .on(target)
            .moveTowards({'x': position.x, 'y': position.y})
            .opacity(0)
            .delay(250)

            .effect()
            .from(target)
            .atLocation(target)
            .moveTowards({'x': position.x + (canvas.grid.size * target.document.width) / 2, 'y': position.y + (canvas.grid.size * target.document.height) / 2 }, {'ease': 'easeInOutBack', 'rotate': false})
            .zIndex(0.1)
            .scaleToObject(target.document.texture.scaleX * target.document.width)
            .extraEndDuration(500)
            .waitUntilFinished(-300)

            .animation()
            .on(target)
            .fadeIn(250)
            .opacity(1)

            .effect()
            .from(target)
            .atLocation(target)
            .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 75, 'pingPong': true, 'gridUnits': true})
            .scaleToObject(target.document.texture.scaleX)
            .delay(250)
            .opacity(0.5)
            .playIf(() => {
                let distanceToTargetX = Math.abs(sourceToken.x - position.x);
                let distanceToTargetY = Math.abs(sourceToken.y - position.y);
                console.log(distanceToTargetX <= canvas.grid.size && distanceToTargetY <= canvas.grid.size);
                return distanceToTargetX <= canvas.grid.size && distanceToTargetY <= canvas.grid.size;
            })

            .effect()
            .file('animated-spell-effects-cartoon.electricity.19')
            .atLocation(sourceToken)
            .scaleToObject(2)
            .rotateTowards(target)
            .filter('ColorMatrix', {'saturate':1, 'hue': -15 })
            .zIndex(0.2)
            .playIf(() => {
                let distanceToTargetX = Math.abs(sourceToken.x - position.x);
                let distanceToTargetY = Math.abs(sourceToken.y - position.y);
                console.log(canvas.grid.size && distanceToTargetY <= canvas.grid.size);
                return distanceToTargetX <= canvas.grid.size && distanceToTargetY <= canvas.grid.size;
            })

            .play();
    }
    let fDistance = chris.getDistance(workflow.token, target);
    if (fDistance > 5) {
        workflow.damageItem.appliedDamage = 0;
        workflow.damageItem.hpDamage = 0;
        workflow.damageItem.newHP = workflow.damageItem.oldHP;
        workflow.damageItem.newTempHP = workflow.damageItem.oldTempHP;
        workflow.damageItem.tempDamage = 0;
        workflow.damageItem.totalDamage = 0;
    }
    queue.remove(workflow.item.uuid);
}