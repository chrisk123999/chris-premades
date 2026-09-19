import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, tokenUtils, workflowUtils, DamageBonus} from '../../../../../proxy.mjs';
function getCursedToken(effect, workflow) {
    const targetId = effect.flags['chris-premades']?.hexbladesCurse?.target;
    if (!targetId) return;
    return workflow.targets.find(token => token.document.id === targetId)?.document;
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'hexblades-curse' || workflow.targets.size !== 1) return;
    const targetToken = workflow.targets.first().document;
    const sourceEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'hexbladesCurse',
        activityUuid: workflow.activity.uuid,
        specialDuration: ['zeroHP'],
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'hexblades-curse-source'}]}]
    });
    genericUtils.setProperty(sourceEffectData, 'flags.chris-premades.hexbladesCurse.target', targetToken.id);
    const targetEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name + ': ' + _loc('DND5E.Target'),
        img: document.img,
        origin: document.uuid,
        identifier: 'hexbladesCurseTarget',
        activityUuid: workflow.activity.uuid,
        specialDuration: ['zeroHP'],
        macros: [{type: 'effect', macros: [{source: 'chris-premades', rules: '2014', identifier: 'hexblades-curse-target'}]}]
    });
    const [sourceEffect] = await effectUtils.createEffects(workflow.actor, [sourceEffectData]);
    if (!sourceEffect) return;
    await effectUtils.createEffects(targetToken.actor, [targetEffectData], {parentEntity: sourceEffect});
}
async function early({document, workflow}) {
    if (workflow.targets.size !== 1 || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const targetToken = getCursedToken(document, workflow);
    if (!targetToken) return;
    const originItem = (await effectUtils.getOriginActivity(document)).item;
    const effectData = documentUtils.getBaseEffectData(document, {
        name: _loc('CHRISPREMADES.GenericEffects.CriticalThreshold'),
        img: constants.tempConditionIcon,
        origin: document.origin,
        activityUuid: document.flags.cat?.activityUuid,
        specialDuration: ['attackedBySource'],
        changes: [
            {
                key: 'flags.midi-qol.grants.criticalThreshold',
                value: automationUtils.getConfigValue(originItem, 'criticalThreshold'),
                mode: 5,
                priority: 20
            }
        ]
    });
    await effectUtils.createEffects(targetToken.actor, [effectData]);
}
function damage({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    const targetId = document.flags['chris-premades']?.hexbladesCurse?.target;
    const targetToken = workflow.hitTargets.find(token => token.document.id === targetId)?.document;
    if (!targetToken) return;
    const bonus = new DamageBonus(document, {formula: '@prof', optional: false, maxTargets: 1, type: workflow.defaultDamageType});
    bonus.targets = [targetToken];
    return bonus;
}
async function transfer(originActor, originItem) {
    const masterOfHexes = actorUtils.getItemByIdentifier(originActor, 'master-of-hexes');
    if (!masterOfHexes) return;
    const originToken = actorUtils.getFirstToken(originActor);
    if (!originToken || actorUtils.getEffectByStatusID(originActor, 'incapacitated')) return;
    const range = automationUtils.getConfigValue(originItem, 'transferRange');
    const targets = tokenUtils.findNearby(originToken, range, {disposition: 'enemy', includeIncapacitated: false});
    if (!targets.length) return;
    const selection = await dialogUtils.selectTargetDialog(masterOfHexes.name, _loc('CHRISPREMADES.Macros.Legacy.HexbladesCurse.Transfer'), targets, {userId: queryUtils.firstOwner(originActor, true), buttons: 'yesNo'});
    return selection?.result;
}
async function remove({document: effect}) {
    if (effect.parent?.system.attributes.hp.value) return;
    const originActivity = await effectUtils.getOriginActivity(effect);
    const originItem = originActivity?.item;
    const originActor = originItem?.actor;
    if (!originActor) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(originActor, 'hexbladesCurse');
    const targetToken = await transfer(originActor, originItem);
    if (!targetToken) {
        const healing = itemUtils.getActivityByIdentifier(originItem, 'hexblades-curse-healing');
        if (healing) await workflowUtils.completeActivityUse(healing, []);
        if (sourceEffect) await documentUtils.deleteDocument(sourceEffect);
        return;
    }
    const effectData = documentUtils.getBaseEffectData(originActivity, {
        name: effect.name,
        img: effect.img,
        origin: effect.origin,
        identifier: 'hexbladesCurseTarget',
        activityUuid: originActivity.uuid,
        duration: {seconds: effect.duration.remaining},
        specialDuration: ['zeroHP'],
        macros: [{type: 'effect', macros: [{source: 'chris-premades', rules: '2014', identifier: 'hexblades-curse-target'}]}]
    });
    await documentUtils.setFlag(sourceEffect, 'chris-premades', 'hexbladesCurse.target', targetToken.id);
    await effectUtils.createEffects(targetToken.actor, [effectData], {parentEntity: sourceEffect});
}
export const hexbladesCurse = {
    name: 'Hexblade\'s Curse',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        transferRange: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.HexbladesCurse.TransferRange',
            category: 'homebrew'
        },
        criticalThreshold: {
            default: 19,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.HexbladesCurse.CriticalThreshold',
            category: 'homebrew'
        }
    }
};
export const hexbladesCurseSource = {
    name: 'Hexblade\'s Curse: Source',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorPreambleComplete', macro: early, priority: 50},
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: damage, priority: 250}
    ]
};
export const hexbladesCurseTarget = {
    name: 'Hexblade\'s Curse: Target',
    version: '2.0.0',
    rules: '2014',
    effect: [
        {pass: 'deleted', macro: remove, priority: 50}
    ]
};
