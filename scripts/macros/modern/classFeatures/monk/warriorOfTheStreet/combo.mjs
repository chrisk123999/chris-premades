import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
const configKeys = ['startBonus', 'bonusStep', 'maxBonus'];
function isUnarmedStrike(item) {
    return documentUtils.getIdentifier(item) === 'unarmed-strike' || item?.system.type?.value === 'unarmed';
}
function getBonus(effect) {
    return effect.flags['chris-premades']?.combo?.bonus ?? 0;
}
async function setBonus(effect, bonus) {
    if (getBonus(effect) === bonus) return;
    await documentUtils.update(effect, {'flags.chris-premades.combo.bonus': bonus});
}
function playAnimation(item, workflow, bonus) {
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    const targetToken = workflow.hitTargets.first()?.document;
    if (!animation?.macros?.play || !workflow.token || !targetToken) return;
    animation.macros.play(workflow.token.document, targetToken, {...options, bonus});
}
async function begin(item, workflow, startBonus) {
    const activity = itemUtils.getActivityByIdentifier(item, 'begin-combo');
    const sourceEffect = documentUtils.getEffectByIdentifier(item, 'combo');
    if (!activity || !sourceEffect || !activityUtils.checkCosts(activity)) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    if (!await workflowUtils.completeActivityUse(activity)) return;
    const effectData = documentUtils.getEffectData(item, sourceEffect.id);
    genericUtils.setProperty(effectData, 'flags.chris-premades.combo.bonus', startBonus);
    const effect = (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
    if (effect) playAnimation(item, workflow, startBonus);
}
async function guardBreaker(workflow) {
    const item = actorUtils.getItemByIdentifier(workflow.actor, 'special-moves-guard-breaker');
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'guard-breaker') : undefined;
    if (!activity || !activityUtils.checkCosts(activity)) return false;
    const targets = Array.from(workflow.targets, token => token.document ?? token).filter(token => token.actor);
    if (!targets.length) return false;
    if (!await dialogUtils.confirmUseItem(item)) return false;
    const damageType = workflow.activity.damage?.parts?.[0]?.types?.first() ?? workflow.item.system.damage?.base?.types?.first();
    const activityData = activityUtils.getDamageModifiedActivityData(activity, '', {types: damageType ? [damageType] : []});
    return !!await workflowUtils.syntheticActivityDataRoll(activityData, item, targets);
}
async function rollFinished({document: item, workflow}) {
    if (!workflow.activity || !workflow.attackRoll || !workflow.targets.size) return;
    const config = automationUtils.getConfigValues(item, configKeys);
    const unarmed = isUnarmedStrike(workflow.item);
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'combo');
    if (!workflow.hitTargets.size) {
        if (unarmed && await guardBreaker(workflow)) return;
        if (effect) await setBonus(effect, config.startBonus);
        return;
    }
    if (!unarmed) return;
    if (effect) {
        const bonus = Math.min(getBonus(effect) + config.bonusStep, config.maxBonus);
        await setBonus(effect, bonus);
        playAnimation(item, workflow, bonus);
        return;
    }
    if (!(workflowUtils.getDamageDealt(workflow) > 0)) return;
    await begin(item, workflow, config.startBonus);
}
async function attackRollConfig({document: effect, workflow}) {
    if (!isUnarmedStrike(workflow.item) || workflow.activity?.type !== 'attack') return;
    const bonus = getBonus(effect);
    if (bonus) workflowUtils.addAttackRollPart(workflow, bonus);
}
async function damaged({document: effect, ditem}) {
    if (!(ditem?.totalDamage > 0)) return;
    const item = actorUtils.getItemByIdentifier(effect.parent, 'combo');
    await setBonus(effect, item ? automationUtils.getConfigValue(item, 'startBonus') : combo.config.startBonus.default);
}
export const combo = {
    name: 'Combo',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: rollFinished,
            priority: 150
        }
    ],
    config: {
        startBonus: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.Combo.StartBonus',
            category: 'homebrew'
        },
        bonusStep: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.Combo.BonusStep',
            category: 'homebrew'
        },
        maxBonus: {
            default: 6,
            type: 'number',
            label: 'CHRISPREMADES.Config.Max',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'combo'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        }
    }
};
export const comboEffect = {
    name: 'Combo',
    version: combo.version,
    rules: combo.rules,
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attackRollConfig,
            priority: 50
        },
        {
            pass: 'targetDamageComplete',
            macro: damaged,
            priority: 250
        }
    ]
};
