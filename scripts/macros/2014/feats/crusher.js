import {actorUtils, combatUtils, constants, crosshairUtils, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function late({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflow.damageRoll || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('bludgeoning')) return;
    let targetToken = workflow.hitTargets.first();
    if (actorUtils.getSize(targetToken.actor) > actorUtils.getSize(workflow.actor) + 1) return;
    if (!combatUtils.perTurnCheck(item, 'crusher')) return;
    let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.Crusher.Move');
    if (!selection) return;
    await (combatUtils.setTurnCheck(item, 'crusher'));
    let actualHalf = targetToken.document.width / 2;
    let widthAdjust = canvas.grid.distance * Math.floor(actualHalf);
    let fudgeDistance = 0;
    if (widthAdjust !== actualHalf * canvas.grid.distance) {
        fudgeDistance = 2.5;
    }
    fudgeDistance += widthAdjust;
    let position = await crosshairUtils.aimCrosshair({
        token: workflow.token,
        centerpoint: targetToken.center,
        maxRange: genericUtils.convertDistance(5),
        fudgeDistance,
        drawBoundries: true,
        trackDistance: true,
        crosshairsConfig: {
            size: canvas.grid.distance * targetToken.document.width / 2,
            icon: targetToken.document.texture.src,
            resolution: (targetToken.document.width % 2) ? 1 : -1
        }
    });
    if (position.cancelled) return;
    let xOffset = targetToken.document.width * canvas.grid.size / 2;
    let yOffset = targetToken.document.height * canvas.grid.size / 2;
    await genericUtils.update(targetToken.document, {x: (position.x ?? targetToken.document.center.x) - xOffset, y: (position.y ?? targetToken.document.center.y) - yOffset});
    await item.displayCard();
}
async function lateCrit({trigger: {entity: item}, workflow}) {
    if (!workflow.isCritical) return;
    if (workflow.hitTargets.size !== 1 || !workflow.damageRoll || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('bludgeoning')) return;
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {
            seconds: 12
        },
        changes: [
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['turnStartSource']
            }
        }
    };
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData);
    await item.displayCard();
}
export let crusher = {
    name: 'Crusher',
    version: '1.1.42',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: lateCrit,
                priority: 50
            }
        ]
    }
};