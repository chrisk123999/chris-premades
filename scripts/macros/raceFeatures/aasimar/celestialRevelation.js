import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'celestialRevelationEnd', {strict: true});
    if (!feature) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity)
    };
    let identifier = genericUtils.getIdentifier(workflow.item);
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    if (identifier === 'aasimarRadiantSoul') {
        effectData.changes = [
            {
                key: 'system.attributes.movement.fly',
                mode: 4,
                value: workflow.actor.system.attributes.movement.walk,
                priority: 20
            }
        ];
        genericUtils.setProperty(effectData, 'flags.chris-premades.celestialRevelation.damageType', damageType ?? 'radiant');
    } else if (identifier === 'aasimarRadiantConsumption') {
        effectData.changes = [
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 10,
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 20,
                priority: 20
            }
        ];
        effectUtils.addMacro(effectData, 'combat', ['aasimarRadiantConsumption']);
        genericUtils.setProperty(effectData, 'flags.chris-premades.celestialRevelation.damageType', damageType ?? 'radiant');
    } else {
        genericUtils.setProperty(effectData, 'flags.chris-premades.celestialRevelation.damageType', damageType ?? 'necrotic');
    }
    effectUtils.addMacro(effectData, 'midi.actor', ['celestialRevelation']);
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'celestialRevelation', 
        vae: [{
            type: 'use', 
            name: feature.name, 
            identifier, 
            activityIdentifier: 'celestialRevelationEnd'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['celestialRevelationEnd'],
            favorite: true
        }
    });
}
async function end({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'celestialRevelation');
    if (effect) await genericUtils.remove(effect);
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!combatUtils.perTurnCheck(effect, 'celestialRevelation', true, workflow.token.id)) return;
    let use = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: effect.name}));
    if (!use) return;
    await combatUtils.setTurnCheck(effect, 'celestialRevelation');
    let damageFormula = '@prof';
    let damageType = effect.flags['chris-premades'].celestialRevelation.damageType;
    await workflowUtils.bonusDamage(workflow, damageFormula, {damageType});
}
async function applyDamage({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!combatUtils.perTurnCheck(effect, 'celestialRevelation', true, workflow.token.id)) return;
    if (workflow.celestialRevelationChoseNo) return;
    let targetToken = await dialogUtils.selectTargetDialog(effect.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: effect.name}), Array.from(workflow.hitTargets));
    workflow.celestialRevelationChoseNo = true;
    if (!targetToken) return;
    await combatUtils.setTurnCheck(effect, 'celestialRevelation');
    targetToken = targetToken[0];
    let ditem = workflow.damageList.find(i => i.actorId === targetToken.actor.id);
    if (!ditem) return;
    let damageAmount = workflow.actor.system.attributes.prof;
    let damageType = effect.flags['chris-premades'].celestialRevelation.damageType;
    let multiplier = 1;
    let dInd = ditem.rawDamageDetail.findIndex(i => i.type === damageType);
    if (dInd < 0) {
        // Determine multiplier
        let hasImmune = actorUtils.checkTrait(targetToken.actor, 'di', damageType);
        let hasResist = actorUtils.checkTrait(targetToken.actor, 'dr', damageType);
        let hasVulnerable = actorUtils.checkTrait(targetToken.actor, 'dv', damageType);
        if (hasImmune) multiplier *= 0;
        if (hasResist) multiplier *= 0.5;
        if (hasVulnerable) multiplier *= 2;
    } else {
        multiplier = ditem.damageDetail[dInd].active?.multiplier ?? 1;
    }
    ditem.rawDamageDetail.push({value: damageAmount, type: damageType});
    ditem.rawDamageDetail.push({value: Math.floor(damageAmount * multiplier), type: damageType, active: {multiplier}});
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'radiantConsumptionDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature);
}
export let aasimarNecroticShroud = {
    name: 'Celestial Revelation (Necrotic Shroud)',
    version: '1.1.0',
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'necrotic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let aasimarRadiantConsumption = {
    name: 'Celestial Revelation (Radiant Consumption)',
    version: '1.1.0',
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ],
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let aasimarRadiantSoul = {
    name: 'Celestial Revelation (Radiant Soul)',
    version: '1.1.0',
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let celestialRevelation = {
    name: 'Celestial Revelation',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['celestialRevelation']
            },
            {
                pass: 'rollFinished',
                macro: end,
                priority: 50,
                activities: ['celestialRevelationEnd']
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: applyDamage,
                priority: 50
            }
        ]
    }
};