import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let classLevel = workflow.actor.classes?.['blood-hunter']?.system.levels;
    if (!classLevel) return;
    let weaponData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Predatory Strike', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HybridTransformation.PredatoryStrike', identifier: 'predatoryStrike'});
    let revertData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Hybrid Transformation: Revert', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HybridTransformation.Revert', identifier: 'hybridTransformationRevert'});
    if (!weaponData || !revertData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: 1,
                priority: 20
            },
            {
                key: 'system.bonuses.msak.damage',
                mode: 2,
                value: 1,
                priority: 20
            },
            {
                key: 'system.traits.dr.custom',
                mode: 0,
                value: 'non-silver-physical',
                priority: 20
            }
        ],
        flags: {
            dae: {
                showIcon: true,
                specialDuration: [
                    'zeroHP'
                ]
            },
            'chris-premades': {
                hybridTransformation: {
                    originalAvatarImg: workflow.actor.img,
                    originalPrototypeImg: workflow.actor.prototypeToken.texture.src,
                    originalTokenImg: workflow.token.document.texture.src
                }
            }
        }
    };
    if (workflow.actor.armor?.system.type?.value !== 'heavy') effectData.changes.push(
        {
            key: 'system.attributes.ac.bonus',
            mode: 2,
            value: 1,
            priority: 20
        }
    );
    effectUtils.addMacro(effectData, 'effect', ['hybridTransformationActive']);
    effectUtils.addMacro(effectData, 'combat', ['hybridTransformationActive']);
    if (classLevel >= 18) {
        weaponData.system.attack.bonus = '+3';
        effectData.changes[2].value = 3;
        effectData.changes[3].value = 3;
        weaponData.system.damage.parts[0][0] = '1d8[bludgeoning] + @mod';
        weaponData.system.damage.versatile = '1d8[slashing] + @mod';
        delete effectData.duration;
    } else if (classLevel >= 11) {
        weaponData.system.attack.bonus = '+2';
        effectData.changes[2].value = 2;
        effectData.changes[3].value = 2;
        weaponData.system.damage.parts[0][0] = '1d8[bludgeoning] + @mod';
        weaponData.system.damage.versatile = '1d8[slashing] + @mod';
    } else if (classLevel >= 7) {
        weaponData.system.attack.bonus = '+1';
    }
    if (classLevel >= 15) {
        effectUtils.addMacro(effectData, 'midi.actor', ['hybridTransformationActive']);
    }
    let updates = {
        actor: {},
        token: {}
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) {
        genericUtils.setProperty(updates.actor, 'img', avatarImg);
    }
    if (tokenImg) {
        genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates.token, 'texture.src', tokenImg);
    }
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'hybridTransformation', vae: [
        {type: 'use', name: weaponData.name, identifier: 'predatoryStrike'},
        {type: 'use', name: revertData.name, identifier: 'hybridTransformationRevert'}
    ]});
    await itemUtils.createItems(workflow.actor, [weaponData, revertData], {favorite: true, parentEntity: effect});
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(workflow.actor, updates.actor);
    }
    if (Object.entries(updates.token)?.length) {
        await genericUtils.update(workflow.token.document, updates.token);
    }
}
async function earlyBrand({workflow}) {
    if (workflow.targets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'brandOfCastigationSource');
    let targetToken = workflow.targets.first();
    let effects = effectUtils.getAllEffectsByIdentifier(targetToken.actor, 'brandOfCastigation');
    if (!effects.length) return;
    if (!effects.filter(i => i.origin === effect.origin).length) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
}
async function turnStart({trigger: {token}}) {
    let actor = token.actor;
    let classLevel = actor?.classes?.['blood-hunter']?.system.levels;
    if (!classLevel) return;
    let currHP = actor.system.attributes.hp.value;
    let halfHP = Math.floor(actor.system.attributes.hp.max / 2);
    let doHealing = classLevel >= 11 && currHP && currHP < halfHP;
    if (doHealing) {
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Lycan Regeneration', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HybridTransformation.LycanRegeneration'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        await workflowUtils.syntheticItemDataRoll(featureData, actor, [token]);
    }
    if (actor.system.attributes.hp.value >= halfHP) return;
    let bloodlustAdv = classLevel >= 15;
    let isConcentrating = effectUtils.getConcentrationEffect(actor);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Bloodlust', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HybridTransformation.Bloodlust'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData;
    if (isConcentrating) {
        effectData = {
            name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionFailure'),
            img: constants.tempConditionIcon,
            changes: [
                {
                    key: 'flags.midi-qol.fail.ability.save.wis',
                    mode: 0,
                    value: 1,
                    priority: 21
                }
            ]
        };
    } else if (bloodlustAdv) {
        effectData = {
            name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionAdvantage'),
            img: constants.tempConditionIcon,
            changes: [
                {
                    key: 'flags.midi-qol.advantage.ability.save.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ]
        };
    }
    if (effectData) {
        effectData.flags = {
            dae: {
                specialDuration: ['isSave']
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        };
        await effectUtils.createEffect(actor, effectData, {identifier: 'bloodlustCondition'});
    }
    await workflowUtils.syntheticItemDataRoll(featureData, actor, [token]);
    let effect = effectUtils.getEffectByIdentifier(actor, 'bloodlustCondition');
    if (effect) await genericUtils.remove(effect);
}
async function end({trigger: {entity: effect}}) {
    let {originalAvatarImg, originalPrototypeImg, originalTokenImg} = effect.flags['chris-premades'].hybridTransformation;
    let actor = effect.parent;
    let token = actorUtils.getFirstToken(actor)?.document;
    if (!actor) return;
    let currAvatarImg = actor.img;
    let currPrototypeImg = actor.prototypeToken.texture.src;
    let currTokenImg = token?.texture.src;
    let updates = {
        actor: {},
        token: {}
    };
    if (currAvatarImg !== originalAvatarImg) genericUtils.setProperty(updates.actor, 'img', originalAvatarImg);
    if (currPrototypeImg !== originalPrototypeImg) genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', originalPrototypeImg);
    if (currTokenImg !== originalTokenImg) genericUtils.setProperty(updates.token, 'texture.src', originalTokenImg);
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(actor, updates.actor);
    }
    if (token && Object.entries(updates.token)?.length) {
        await genericUtils.update(token, updates.token);
    }
}
async function revert({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hybridTransformation');
    if (effect) await genericUtils.remove(effect);
}
export let hybridTransformation = {
    name: 'Hybrid Transformation',
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HybridTransformation',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HybridTransformation',
            type: 'file',
            default: '',
            category: 'visuals'
        }
    ],
    ddbi: {
        removedItems: {
            'Hybrid Transformation: Hybrid Form': [
                'Hybrid Form - Predatory Strike (STR)',
                'Hybrid Form - Predatory Strike (DEX)'
            ]
        }
    }
};
export let hybridTransformationActive = {
    name: 'Hybrid Transformation: Active',
    version: hybridTransformation.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: revert,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: earlyBrand,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};