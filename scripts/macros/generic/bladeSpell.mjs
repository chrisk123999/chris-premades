import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function selectNearby(document, targets, count) {
    if (targets.length <= count) return targets;
    const content = count > 1 ? 'CHRISPREMADES.Macros.Generic.BladeSpell.SelectNearbyTargets' : 'CHRISPREMADES.Macros.Generic.BladeSpell.SelectNearbyTarget';
    const selection = await dialogUtils.selectTargetDialog(document.name, content, targets, {type: count > 1 ? 'multiple' : 'one', maxAmount: count, skipDeadAndUnconscious: false});
    if (!selection?.result) return [];
    return [selection.result].flat();
}
async function use({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'bladeSpell', configKeys);
    if (config.activityId && config.activityId !== workflow.activity.id) return;
    if (workflow.targets.size !== 1) return;
    const targetToken = workflow.targets.first().document;
    const weapons = actorUtils.getEquippedWeapons(workflow.actor).filter(weapon =>
        weapon.system.activities.getByType('attack').length &&
        (!config.meleeOnly || CONFIG.DND5E.weaponTypeMap[weapon.system.type.value] === 'melee') &&
        (!config.proficientOnly || weapon.system.proficiencyMultiplier >= 1)
    );
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Generic.BladeSpell.NoWeapons', {type: 'warn'});
        return;
    }
    const weapon = weapons.length === 1 ? weapons[0] : await dialogUtils.selectDocumentDialog(document.name, 'CHRISPREMADES.Macros.Generic.BladeSpell.Weapon', weapons);
    if (!weapon) return;
    let damageType;
    if (config.damageTypes.length === 1 && !config.optionalDamageReplacement) {
        damageType = config.damageTypes[0];
    } else if (config.damageTypes.length) {
        damageType = await dialogUtils.selectDamageType(config.damageTypes, document.name, 'CHRISPREMADES.Macros.Generic.BladeSpell.ReplaceDamage', {addNo: config.optionalDamageReplacement});
    }
    const ability = config.ability === 'spellcasting' ? document.system.availableAbilities?.first() : config.ability;
    const diceNumber = config.bonusDamageDieFormula ? (await rollUtils.rollDice(config.bonusDamageDieFormula, {document})).total : (document.system.scalingIncrease ?? 0);
    const itemData = weapon.toObject();
    genericUtils.setProperty(itemData, 'flags.chris-premades.bladeCantrip', document.name);
    if (damageType) itemData.system.damage.base.types = [damageType];
    const attacks = weapon.system.activities.getByType('attack');
    itemData.system.activities = Object.fromEntries(Object.entries(itemData.system.activities).filter(([id]) => attacks.some(activity => activity.id === id)));
    attacks.forEach(activity => {
        const activityData = itemData.system.activities[activity.id];
        if (ability && ability !== 'default') activityData.attack.ability = ability;
        if (damageType) activityData.damage.parts.forEach(part => part.types = [damageType]);
        if (diceNumber && config.bonusDamageDieDenomination) activityData.damage.parts.push({
            number: diceNumber,
            denomination: config.bonusDamageDieDenomination,
            types: config.bonusDamageTypes
        });
    });
    const attackWorkflow = await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [targetToken]);
    if (!attackWorkflow) return;
    const hitTarget = attackWorkflow.hitTargets.first()?.document;
    const {animation, options: animationOptions} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'bladeSpell'});
    if (animation?.macros.attack) await animation.macros.attack(workflow.token.document, targetToken, {...animationOptions, missed: !hitTarget});
    if (!hitTarget) return;
    if (config.onHitEffect) {
        const effectData = documentUtils.getEffectData(document, config.onHitEffect);
        if (effectData && hitTarget.actor) await effectUtils.createEffects(hitTarget.actor, [effectData]);
    }
    if (config.activityOnHit) {
        const activity = document.system.activities.get(config.activityOnHit);
        if (activity) await workflowUtils.completeActivityUse(activity, [hitTarget], {spellSlot: false});
    }
    if (config.effectNearby) {
        const effectData = documentUtils.getEffectData(document, config.effectNearby);
        const targets = effectData ? await selectNearby(document, tokenUtils.findNearby(hitTarget, config.effectNearbyRange).filter(token => token.id !== workflow.token.id), config.effectNearbyTargets) : [];
        await Promise.all(targets.filter(token => token.actor).map(token => effectUtils.createEffects(token.actor, [genericUtils.deepClone(effectData)])));
    }
    if (config.activityNearby) {
        const activity = document.system.activities.get(config.activityNearby);
        if (!activity) return;
        const targets = await selectNearby(document, tokenUtils.findNearby(hitTarget, config.activityNearbyRange).filter(token => token.id !== workflow.token.id), Number(activity.target.affects.count) || 1);
        if (!targets.length) return;
        if (animation?.macros.leap) await Promise.all(targets.map(token => animation.macros.leap(hitTarget, token, animationOptions)));
        await workflowUtils.completeActivityUse(activity, targets, {spellSlot: false});
    }
}
export const bladeSpell = {
    rules: 'all',
    version: '2.0.0',
    category: 'damage',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityIdHint'
        },
        meleeOnly: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.MeleeOnly',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.MeleeOnlyHint'
        },
        proficientOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ProficientOnly',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ProficientOnlyHint'
        },
        ability: {
            default: 'default',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Ability',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.AbilityHint',
            get options() {
                return [
                    {value: 'default', label: 'DND5E.Default'},
                    {value: 'spellcasting', label: 'DND5E.SpellAbility'},
                    ...constants.abilityOptions
                ];
            }
        },
        damageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.DamageTypesHint',
            get options() { return constants.damageTypeOptions; }
        },
        optionalDamageReplacement: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.OptionalDamageReplacement',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.OptionalDamageReplacementHint'
        },
        bonusDamageDieFormula: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageDieFormula',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageDieFormulaHint'
        },
        bonusDamageDieDenomination: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DieSize',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageDieDenominationHint'
        },
        bonusDamageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageTypes',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageTypesHint',
            get options() { return constants.damageTypeOptions; }
        },
        onHitEffect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.OnHitEffect',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.OnHitEffectHint'
        },
        activityOnHit: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityOnHit',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityOnHitHint'
        },
        effectNearby: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearby',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyHint'
        },
        effectNearbyRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyRange',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyRangeHint'
        },
        effectNearbyTargets: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyTargets',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyTargetsHint'
        },
        activityNearby: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearby',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearbyHint'
        },
        activityNearbyRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearbyRange',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearbyRangeHint'
        },
        animation: {
            default: {
                source: 'none',
                identifier: 'none'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        }
    }
};
const configKeys = Object.keys(bladeSpell.genericConfig);
