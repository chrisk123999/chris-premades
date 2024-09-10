import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

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
    await item.use();
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
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let damage = Math.max(1, itemUtils.getMod(originItem));
    if (effect.parent.classes?.['blood-hunter']?.system?.levels >= 13) damage *= 2;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Brand of Castigation: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BrandOfCastigation.Damage'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts[0][0] = damage + '[psychic]';
    await workflowUtils.syntheticItemDataRoll(featureData, effect.parent, [workflow.token]);
}
async function hitNear({trigger: {entity: effect}, workflow}) {
    let effects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'brandOfCastigation');
    if (!effects.length) return;
    if (!effects.filter(i => i.origin === effect.origin).length) return;
    let originToken = actorUtils.getFirstToken(effect.parent);
    if (!originToken) return;
    let nearbyTokens = tokenUtils.findNearby(originToken, 5, 'any').filter(i => tokenUtils.canSee(originToken, i));
    if (!nearbyTokens.some(i => workflow.hitTargets.has(i))) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let damage = Math.max(1, itemUtils.getMod(originItem));
    if (effect.parent.classes?.['blood-hunter']?.system?.levels >= 13) damage *= 2;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Brand of Castigation: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BrandOfCastigation.Damage'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts[0][0] = damage + '[psychic]';
    await workflowUtils.syntheticItemDataRoll(featureData, effect.parent, [workflow.token]);
}
export let brandOfCastigation = {
    name: 'Brand of Castigation',
    version: '0.12.64',
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