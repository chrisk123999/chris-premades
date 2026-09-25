import {automationUtils, constants, DamageBonus, dialogUtils, documentUtils, effectUtils, genericUtils, workflowUtils} from '../../../proxy.mjs';
function abilityOptions() {
    return Object.values(CONFIG.DND5E.abilities).map(ability => [ability.label, ability.abbreviation]);
}
function hexedEffectData(activity, document, seconds, ability) {
    return documentUtils.getBaseEffectData(activity, {
        name: _loc('CHRISPREMADES.Macros.All.Hex.Hexed'),
        img: document.img,
        origin: document.uuid,
        identifier: 'hexed',
        activityUuid: activity.uuid,
        duration: {seconds},
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.check.' + ability,
                type: 'custom',
                value: true,
                priority: 20
            }
        ]
    });
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'hex') return;
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const cancel = async () => {
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
    };
    if (!workflow.targets.size) return await cancel();
    const ability = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.All.Hex.SelectAbility'), abilityOptions());
    if (!ability) return await cancel();
    const seconds = workflowUtils.getScaledDuration(workflow);
    const casterEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'hex',
        activityUuid: workflow.activity.uuid,
        duration: {seconds},
        unhideActivities: ['hex-move'],
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: 'all', identifier: 'hex-attack'}]}]
    });
    genericUtils.setProperty(casterEffectData, 'flags.chris-premades.hex', {
        targets: Array.from(workflow.targets, token => token.document.uuid),
        damageType: automationUtils.getConfigValue(document, 'damageType'),
        formula: automationUtils.getConfigValue(document, 'formula'),
        ability
    });
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [casterEffectData], {parentEntity: concentrationEffect});
    if (!casterEffect) return;
    for (const target of workflow.targets) {
        await effectUtils.createEffects(target.actor, [hexedEffectData(workflow.activity, document, seconds, ability)], {parentEntity: casterEffect});
    }
    if (concentrationEffect) await documentUtils.update(concentrationEffect, {'duration.value': seconds, 'duration.units': 'seconds'});
}
async function move({document, workflow}) {
    if (workflow.activity.identifier !== 'hex-move' || workflow.targets.size !== 1) return;
    const casterEffect = documentUtils.getEffectByIdentifier(workflow.actor, 'hex');
    if (!casterEffect) return;
    const hexData = casterEffect.flags['chris-premades'].hex;
    const current = hexData.targets.map(uuid => fromUuidSync(uuid)).filter(token => token);
    let previous = current[0];
    if (current.length > 1) {
        const selection = await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.All.Hex.Multiple'), current, {skipDeadAndUnconscious: false});
        previous = selection?.result ?? current[0];
    }
    if (previous?.actor) {
        const hexedEffect = documentUtils.getEffectByIdentifier(previous.actor, 'hexed');
        if (hexedEffect) await documentUtils.deleteDocument(hexedEffect);
    }
    const newTarget = workflow.targets.first().document;
    const targets = hexData.targets.filter(uuid => uuid !== previous?.uuid);
    targets.push(newTarget.uuid);
    await documentUtils.setFlag(casterEffect, 'chris-premades', 'hex.targets', targets);
    const effectData = hexedEffectData(workflow.activity, document, casterEffect.duration.remaining, hexData.ability);
    await effectUtils.createEffects(newTarget.actor, [effectData], {parentEntity: casterEffect});
}
async function damage({document, workflow}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const hexData = document.flags['chris-premades']?.hex;
    if (!hexData) return;
    const targets = Array.from(workflow.hitTargets, token => token.document).filter(token => hexData.targets.includes(token.uuid));
    if (!targets.length) return;
    const bonus = new DamageBonus(document, {formula: hexData.formula, optional: false, type: hexData.damageType});
    bonus.targets = targets;
    return bonus;
}
export const hex = {
    name: 'Hex',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemRollFinished', macro: move, priority: 50}
    ],
    config: {
        damageType: {
            default: 'necrotic',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        },
        formula: {
            default: '1d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
export const hexAttack = {
    name: 'Hex: Attack',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: damage, priority: 250}
    ]
};
