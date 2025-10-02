import {activityUtils, actorUtils, combatUtils, crosshairUtils, effectUtils, genericUtils, itemUtils, templateUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                rules: 'modern',
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['conjureCelestialActive']
                }
            }
        }
    });
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'conjureCelestialMove', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                conjureCelestial: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        strictlyInterdependent: true,
        rules: 'modern',
        vae: [{
            type: 'use',
            name: feature.name,
            identifier: 'conjureCelestial',
            activityIdentifier: 'conjureCelestialMove'
        }],
        identifier: 'conjureCelestial',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['conjureCelestialMove'],
            favorite: true
        }
    });
    let friendlyTargets = workflow.targets.filter(t => t.document.disposition === workflow.token.document.disposition);
    let enemyTargets = workflow.targets.difference(friendlyTargets);
    if (friendlyTargets.size) {
        let healFeature = activityUtils.getActivityByIdentifier(workflow.item, 'conjureCelestialHeal', {strict: true});
        if (healFeature) await workflowUtils.syntheticActivityRoll(healFeature, Array.from(friendlyTargets), {atLevel: workflow.castData.castLevel});
    }
    if (enemyTargets.size) {
        let saveFeature = activityUtils.getActivityByIdentifier(workflow.item, 'conjureCelestialDamage', {strict: true});
        if (saveFeature) await workflowUtils.syntheticActivityRoll(saveFeature, Array.from(enemyTargets), {atLevel: workflow.castData.castLevel});
    }
}
async function move({trigger: {castData}, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'conjureCelestial');
    let template = await fromUuid(effect?.flags['chris-premades'].conjureCelestial.templateUuid);
    if (!template) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({token: workflow.token, maxRange: 30, centerpoint: template.object.center, crosshairsConfig: {icon: effect.img, resolution: 2, size: template.distance}, drawBoundries: true});
    await workflow.actor.sheet.maximize();
    if (position.cancelled) return;
    let startPoint = {x: template.x, y: template.y};
    let endPoint = {x: position.x ?? template.x, y: position.y ?? template.y};
    await genericUtils.update(template, endPoint);
    let targets = tokenUtils.getMovementHitTokens(startPoint, endPoint, template.distance);
    for (const target of targets) {
        let [targetCombatant] = game.combat.getCombatantsByToken(target.document);
        if (!targetCombatant) continue;
        if (!combatUtils.perTurnCheck(targetCombatant, 'conjureCelestial')) {
            targets.delete(target);
            continue;
        }
        combatUtils.setTurnCheck(targetCombatant, 'conjureCelestial');
    }
    if (!targets.size) return;
    let friendlyTargets = targets.filter(t => t.document.disposition === workflow.token.document.disposition);
    let enemyTargets = targets.difference(friendlyTargets);
    if (friendlyTargets.size) {
        let healFeature = activityUtils.getActivityByIdentifier(workflow.item, 'conjureCelestialHeal', {strict: true});
        if (healFeature) await workflowUtils.syntheticActivityRoll(healFeature, Array.from(friendlyTargets), {atLevel: castData.castLevel});
    }
    if (enemyTargets.size) {
        let saveFeature = activityUtils.getActivityByIdentifier(workflow.item, 'conjureCelestialDamage', {strict: true});
        if (saveFeature) await workflowUtils.syntheticActivityRoll(saveFeature, Array.from(enemyTargets), {atLevel: castData.castLevel});
    }
}
async function enter({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'conjureCelestial')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'conjureCelestial');
    let originItem = fromUuidSync(template.flags.dnd5e.item);
    let featureIdentifier;
    if (token.document.disposition === actorUtils.getFirstToken(originItem.parent)?.document.disposition) {
        featureIdentifier = 'conjureCelestialHeal';
    } else {
        featureIdentifier = 'conjureCelestialDamage';
    }
    let feature = activityUtils.getActivityByIdentifier(originItem, featureIdentifier, {strict: true});
    if (feature) await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function turnEnd({trigger: {entity: template, castData, token, previousRound, previousTurn}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    let turnToCheck = previousRound + '-' + previousTurn;
    let lastDamagedTurn = targetCombatant.flags['chris-premades']?.['conjureCelestial']?.turn;
    if (lastDamagedTurn === turnToCheck) return;
    let originItem = fromUuidSync(template.flags.dnd5e.item);
    let featureIdentifier;
    if (token.document.disposition === actorUtils.getFirstToken(originItem.parent)?.document.disposition) {
        featureIdentifier = 'conjureCelestialHeal';
    } else {
        featureIdentifier = 'conjureCelestialDamage';
    }
    let feature = activityUtils.getActivityByIdentifier(originItem, featureIdentifier, {strict: true});
    if (feature) await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let conjureCelestial = {
    name: 'Conjure Celestial',
    version: '1.3.84',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['conjureCelestial']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['conjureCelestialMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['conjureCelestialMove']
            }
        ]
    }
};
export let conjureCelestialActive = {
    name: 'Conjure Celestial: Active',
    version: conjureCelestial.version,
    rules: conjureCelestial.rules,
    template: [
        {
            pass: 'enter',
            macro: enter,
            priority: 50
        },
        {
            pass: 'passedThrough',
            macro: enter,
            priority: 50
        },
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};