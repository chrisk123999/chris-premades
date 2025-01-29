import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.type !== 'weapon') return;
    if (!item.system.uses.value) return;
    let enchant = Array.from(workflow.item.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'crimsonRite');
    if (!enchant) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'brandOfCastigationSource');
    if (effect) await genericUtils.remove(effect);
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        flags: {
            'chris-premades': {
                macros: {
                    midi: {
                        actor: ['brandOfCastigationActive']
                    }
                }
            }
        }
    };
    let feature = activityUtils.getActivityByIdentifier(item, 'brandOfCastigation', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [], {config: {consumeUsage: true}});
    effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'brandOfCastigationSource'});
    if (!effect) return;
    effectData.flags = {
        dae: {
            showIcon: true
        }
    };
    effectData.name = genericUtils.translate('CHRISPREMADES.Macros.BrandOfCastigation.Branded');
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {identifier: 'brandOfCastigation', parentEntity: effect, strictlyInterdependent: true});
}
async function hit({trigger: {entity: effect}, workflow}) {
    let effects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'brandOfCastigation');
    if (!effects.length) return;
    if (!effects.filter(i => i.origin === effect.origin).length) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let feature = activityUtils.getActivityByIdentifier(originItem, 'brandOfCastigationDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [workflow.token]);
}
async function hitNear({trigger: {entity: effect}, workflow}) {
    let effects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'brandOfCastigation');
    if (!effects.length) return;
    if (!effects.filter(i => i.origin === effect.origin).length) return;
    let originToken = actorUtils.getFirstToken(effect.parent);
    if (!originToken) return;
    let nearbyTokens = tokenUtils.findNearby(originToken, 5, 'any', {includeIncapacitated: true}).filter(i => tokenUtils.canSee(originToken, i));
    if (!nearbyTokens.some(i => workflow.hitTargets.has(i))) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let feature = activityUtils.getActivityByIdentifier(originItem, 'brandOfCastigationDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [workflow.token]);
}
export let brandOfCastigation = {
    name: 'Brand of Castigation',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
export let brandOfCastigationActive = {
    name: 'Brand of Castigation: Active',
    version: brandOfCastigation.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 50
            },
            {
                pass: 'sceneRollFinished',
                macro: hitNear,
                priority: 50
            }
        ]
    }
};