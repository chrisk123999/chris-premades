import {playWeaponAnimation} from './weaponAnimation.mjs';
import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
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
    if (workflow.targets.count !== 1) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'Select exactly one target.');
    const targetToken = workflow.targets.documents[0];
    const weapons = actorUtils.getEquippedWeapons(workflow.actor).filter(weapon =>
        weapon.system.activities.getByType('attack').length &&
        (!config.meleeOnly || CONFIG.DND5E.weaponTypeMap[weapon.system.type.value] === 'melee') &&
        (!config.proficientOnly || weapon.system.proficiencyMultiplier >= 1)
    );
    if (!weapons.length) {
        Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'CHRISPREMADES.Macros.Generic.BladeSpell.NoWeapons', {notify: 'warn'});
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
    genericUtils.setProperty(itemData, 'flags.chris-premades.bladeCantrip', {name: document.name, school: workflow.item.system.school});
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
    const {animation, options: animationOptions} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'bladeSpell'});
    const syncWeaponAnimation = !!animation?.macros.attack && weapon.flags.cat?.macros?.roll?.some(macro => macro.identifier === 'weaponAnimation');
    const attackOptions = {workflowOptions: {autoRollAttack: true, fastForwardDamage: true}};
    if (syncWeaponAnimation) workflowUtils.setWorkflowProperty(attackOptions, 'skipWeaponAnimation', true);
    const attackWorkflow = await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [targetToken], {fast: false, options: attackOptions});
    if (!attackWorkflow) return;
    const hitTarget = attackWorkflow.hitTargets.documents[0];
    if (animation?.macros.attack && targetToken.object) {
        let struck = !syncWeaponAnimation;
        const strike = () => {
            struck = true;
            return playWeaponAnimation(weapon, attackWorkflow);
        };
        await animation.macros.attack(workflow.token.document, targetToken, {...animationOptions, missed: !hitTarget, strike});
        if (!struck) await strike();
    }
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
        const targets = effectData && hitTarget.object ? await selectNearby(document, tokenUtils.findNearby(hitTarget, config.effectNearbyRange).filter(token => token.id !== workflow.token.id), config.effectNearbyTargets) : [];
        await Promise.all(targets.filter(token => token.actor).map(token => effectUtils.createEffects(token.actor, [genericUtils.deepClone(effectData)])));
    }
    if (config.activityNearby) {
        const activity = document.system.activities.get(config.activityNearby);
        if (!activity) return;
        const targets = hitTarget.object ? await selectNearby(document, tokenUtils.findNearby(hitTarget, config.activityNearbyRange).filter(token => token.id !== workflow.token.id), Number(activity.target.affects.count) || 1) : [];
        if (!targets.length) return;
        if (animation?.macros.leap) await Promise.all(targets.map(token => animation.macros.leap(hitTarget, token, animationOptions)));
        await workflowUtils.completeActivityUse(activity, targets, {spellSlot: false});
    }
}
/**
 * Makes an attack with one of the caster's equipped weapons against a single target, then applies effects and activities
 * to the hit target and to chosen creatures near it. The weapon attack can use a different ability and damage type and
 * gain extra damage dice. A weapon with `weaponAnimation` plays its own animation in step with this item's animation.
 */
export const bladeSpell = {
    rules: 'all',
    version: '2.1.10',
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
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityId.Hint'
        },
        meleeOnly: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.MeleeOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.MeleeOnly.Hint'
        },
        proficientOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ProficientOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ProficientOnly.Hint'
        },
        ability: {
            default: 'default',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Ability',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.Ability.Hint',
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
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.DamageTypes.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        optionalDamageReplacement: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.OptionalDamageReplacement.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.OptionalDamageReplacement.Hint'
        },
        bonusDamageDieFormula: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageDieFormula.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageDieFormula.Hint'
        },
        bonusDamageDieDenomination: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DieSize',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageDieDenomination.Hint'
        },
        bonusDamageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.BonusDamageTypes.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        onHitEffect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.OnHitEffect.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.OnHitEffect.Hint'
        },
        activityOnHit: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityOnHit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityOnHit.Hint'
        },
        effectNearby: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearby.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearby.Hint'
        },
        effectNearbyRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyRange.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyRange.Hint'
        },
        effectNearbyTargets: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyTargets.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.EffectNearbyTargets.Hint'
        },
        activityNearby: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearby.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearby.Hint'
        },
        activityNearbyRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearbyRange.Label',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.ActivityNearbyRange.Hint'
        },
        animation: {
            default: {
                source: 'none',
                identifier: 'none'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.BladeSpell.Animation.Hint'
        }
    }
};
const configKeys = Object.keys(bladeSpell.genericConfig);
