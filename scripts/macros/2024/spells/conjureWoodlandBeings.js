import {activityUtils, combatUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                conjureWoodlandBeings: {
                    touchedTokenIds: {}
                },
                macros: {
                    movement: ['conjureWoodlandBeingsDamage'],
                    combat: ['conjureWoodlandBeingsDamage'],
                },
                castData: {
                    baseLevel: workflow.castData.baseLevel,
                    castLevel: workflowUtils.getCastLevel(workflow),
                    saveDC: itemUtils.getSaveDC(workflow.item)
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        identifier: 'conjureWoodlandBeings',
        interdependent: true,
        rules: 'modern'
    });
    let nearbyTokens = tokenUtils.findNearby(workflow.token, 10, 'enemy');
    let turnToCheck;
    if (combatUtils.inCombat) turnToCheck = combatUtils.currentTurn();
    await damageHelper(nearbyTokens, effect, workflow.token, turnToCheck);
}
async function moved({trigger: {token, entity: effect}, options}) {
    let startPoint = genericUtils.duplicate(options._movement[token.id].origin);
    let offset = token.document.width * canvas.grid.size / 2;
    startPoint.x += offset;
    startPoint.y += offset;
    let endPoint = {x: token.center.x, y: token.center.y};
    let radius = 10 + token.document.width * canvas.grid.distance;
    let affectedTokens = Array.from(tokenUtils.getMovementHitTokens(startPoint, endPoint, radius)).filter(t => t.document.disposition !== token.document.disposition);
    let turnToCheck;
    if (combatUtils.inCombat) turnToCheck = combatUtils.currentTurn();
    await damageHelper(affectedTokens, effect, token, turnToCheck);
}
async function turnEnd({trigger: {token, target, entity: effect, previousTurn, previousRound}}) {
    let turnToCheck = previousRound + '-' + previousTurn;
    await damageHelper([target], effect, token, turnToCheck);
}
async function movedNear({trigger: {target, token, entity: effect}, options}) {
    let movementOrigin = genericUtils.duplicate(options._movement?.[target.id]?.origin);
    let tempToken = await target.actor.getTokenDocument({
        x: movementOrigin?.x ?? target.x,
        y: movementOrigin?.y ?? target.y,
        elevation: movementOrigin.elevation ?? target.elevation,
        actorLink: false,
        hidden: true,
        delta: {ownership: target.actor.ownership}
    }, {parent: canvas.scene});
    let oldDistance = tokenUtils.getDistance(token, tempToken);
    if (oldDistance <= 10) return;
    let turnToCheck;
    if (combatUtils.inCombat) turnToCheck = combatUtils.currentTurn();
    await damageHelper([target], effect, token, turnToCheck);
}
async function damageHelper(affectedTokens, effect, token, turnToCheck) {
    let allEffects = canvas.tokens.placeables
        .filter(i => i.document.disposition === token.document.disposition)
        .map(i => effectUtils.getEffectByIdentifier(i.actor, 'conjureWoodlandBeings'))
        .filter(i => i);
    if (turnToCheck) {
        affectedTokens = affectedTokens.filter(target => {
            return !allEffects.find(i => i.flags['chris-premades'].conjureWoodlandBeings.touchedTokenIds[turnToCheck]?.includes(target.id));
        });
    }
    affectedTokens = affectedTokens.filter(target => tokenUtils.canSee(token, target));
    if (!affectedTokens.length) return;
    let feature = activityUtils.getActivityByIdentifier(effectUtils.getOriginItemSync(effect), 'conjureWoodlandBeingsDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, affectedTokens, {atLevel: effect.flags['chris-premades'].castData.castLevel});
    if (turnToCheck) {
        let touchedTokenIds = effect.flags['chris-premades'].conjureWoodlandBeings.touchedTokenIds[turnToCheck] ?? [];
        touchedTokenIds.push(...affectedTokens.map(i => i.id));
        await genericUtils.setFlag(effect, 'chris-premades', 'conjureWoodlandBeings.touchedTokenIds.' + turnToCheck, touchedTokenIds);
    }
}
export let conjureWoodlandBeings = {
    name: 'Conjure Woodland Beings',
    version: '1.3.84',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['conjureWoodlandBeings']
            }
        ]
    }
};
export let conjureWoodlandBeingsDamage = {
    name: 'Conjure Woodland Beings: Damage',
    version: conjureWoodlandBeings.version,
    rules: conjureWoodlandBeings.rules,
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEnd,
            priority: 50,
            distance: 10,
            disposition: 'enemy'
        }
    ],
    movement: [
        {
            pass: 'movedNear',
            macro: movedNear,
            priority: 50,
            distance: 10,
            disposition: 'enemy'
        },
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ]
};
