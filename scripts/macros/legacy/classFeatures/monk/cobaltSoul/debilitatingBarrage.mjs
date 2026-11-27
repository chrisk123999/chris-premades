import {actorUtils, dialogUtils, documentUtils, effectUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({workflow}) {
    if (workflow.activity.identifier !== 'use') return;
    const target = workflow.targets.documents[0]?.actor;
    if (!target || actorUtils.getEffects(target).some(effect => documentUtils.getIdentifier(effect) === 'debilitatingBarrageImmune')) {
        await workflowUtils.refundUse(workflow);
        return;
    }
    const types = Object.keys(CONFIG.DND5E.damageTypes).filter(type => !['none', 'midi-none'].includes(type) && !actorUtils.checkTrait(target, 'di', type));
    const type = await dialogUtils.selectDamageType(types, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType', {userId: queryUtils.firstOwner(workflow.actor, true)});
    if (!type) {
        await workflowUtils.refundUse(workflow);
        return;
    }
    const barrage = workflow.item.effects.find(effect => documentUtils.getIdentifier(effect) === 'debilitatingBarrageEffect');
    const immune = workflow.item.effects.find(effect => documentUtils.getIdentifier(effect) === 'debilitatingBarrageImmune');
    if (!barrage || !immune) return;
    const resistant = actorUtils.checkTrait(target, 'dr', type);
    const barrageData = documentUtils.getEffectData(workflow.activity, barrage.id);
    barrageData.system.changes = [{key: resistant ? 'system.traits.dr.value' : 'system.traits.dv.value', type: 'add', value: resistant ? '-' + type : type, priority: 20}];
    barrageData.flags['chris-premades'] = {...barrageData.flags['chris-premades'], debilitatingBarrage: type};
    await effectUtils.createEffects(target, [barrageData, documentUtils.getEffectData(workflow.activity, immune.id)]);
}
async function hit({document: effect, workflow}) {
    const type = effect.flags['chris-premades']?.debilitatingBarrage;
    if (!type || !workflow.damageRolls?.length || !workflowUtils.getDamageTypes(workflow.damageRolls).has(type)) return;
    if (!workflow.hitTargets.documents.some(token => token.actor === effect.parent)) return;
    if (game.combat?.started) await documentUtils.setFlag(effect, 'chris-premades', 'debilitatingBarrageHit', true);
    else await documentUtils.deleteDocument(effect);
}
async function turnEnd({document: effect}) {
    if (effect.flags['chris-premades']?.debilitatingBarrageHit) await documentUtils.deleteDocument(effect);
}
export const debilitatingBarrage = {
    name: 'Debilitating Barrage',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
export const debilitatingBarrageEffect = {
    name: 'Debilitating Barrage: Effect',
    version: debilitatingBarrage.version,
    rules: '2014',
    roll: [
        {
            pass: 'targetRollFinished',
            macro: hit,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'sceneTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
