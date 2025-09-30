import {crosshairUtils} from '../../../lib/utilities/crosshairUtils.js';
import {activityUtils, combatUtils, effectUtils, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';
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
                    template: ['moonbeamBeam']
                }
            }
        }
    });
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'moonbeamMove', {strict: true});
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
                moonbeam: {
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
            identifier: 'moonbeam',
            activityIdentifier: 'moonbeamMove'
        }], 
        identifier: 'moonbeam',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['moonbeamMove'],
            favorite: true
        }
    });
}
async function move({trigger: {castData}, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'moonbeam');
    let template = await fromUuid(effect?.flags['chris-premades'].moonbeam.templateUuid);
    if (!template) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({token: workflow.token, maxRange: genericUtils.convertDistance(60), centerpoint: template.object.center, crosshairsConfig: {icon: effect.img, resolution: 2, size: template.distance}, drawBoundries: true});
    await workflow.actor.sheet.maximize();
    if (position.cancelled) return;
    await genericUtils.update(template, {
        x: position.x ?? template.x,
        y: position.y ?? template.y
    });
    let targets = templateUtils.getTokensInTemplate(template);
    for (const target of targets) {
        if (!combatUtils.perTurnCheck(target.document, 'moonbeam')) {
            targets.delete(target);
            continue;
        }
        combatUtils.setTurnCheck(target.document, 'moonbeam');
    }
    if (targets.size == 0) return;
    let damageFeature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'moonbeamDamage', {strict: true});
    if (!damageFeature) return;
    await workflowUtils.syntheticActivityRoll(damageFeature, Array.from(targets), {atLevel: castData.castLevel});
}
async function enter({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'moonbeam')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'moonbeam');
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'moonbeamDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function turnEnd({trigger: {entity: template, castData, token, previousRound, previousTurn}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    let turnToCheck = previousRound + '-' + previousTurn;
    let lastDamagedTurn = targetCombatant.flags['chris-premades']?.['moonbeam']?.turn;
    if (lastDamagedTurn == turnToCheck) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'moonbeamDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let moonbeam = {
    name: 'Moonbeam',
    version: '1.2.14',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['moonbeam']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['moonbeamMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['moonbeamMove']
            }
        ]
    }
};
export let moonbeamBeam = {
    name: 'Moonbeam: Beam',
    version: moonbeam.version,
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