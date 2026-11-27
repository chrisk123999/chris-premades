import {actorUtils, documentUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
function isFirearm(workflow) {
    return workflow.item?.system.type?.value === 'firearm' && workflowUtils.isAttackType(workflow, 'weaponAttack');
}
async function regain({document: item, workflow}) {
    if (!isFirearm(workflow) || !workflow.attackRoll || item.system.uses.spent < 1) return;
    const natural = workflow.d20AttackRoll ?? 0;
    const vicious = natural >= 19 && actorUtils.getItemByIdentifier(workflow.actor, 'vicious-intent');
    const dropped = workflow.damageList?.some(entry => entry.oldHP > 0 && !entry.newHP);
    if (natural !== 20 && !dropped && !vicious) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'regain');
    if (activity) await workflowUtils.completeActivityUse(activity, []);
}
function criticalRange({workflow}) {
    if (isFirearm(workflow)) workflowUtils.expandAttackCriticalRange(workflow);
}
async function hemorrhage({document: item, workflow}) {
    if (!isFirearm(workflow) || !workflow.isCritical || !workflow.hitTargets.count) return;
    const damage = Math.floor((workflow.damageTotal ?? 0) / 2);
    if (!damage) return;
    const effects = workflow.hitTargets.documents.filter(token => token.actor).map(token => ({actor: token.actor, data: documentUtils.getBaseEffectData(item, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'hemorrhagingCritical',
        duration: {value: 2, units: 'rounds', expiry: 'turnEnd'}
    })}));
    for (const {actor, data} of effects) {
        genericUtils.setProperty(data, 'flags.chris-premades.hemorrhagingCritical', {damage, type: workflow.defaultDamageType});
        genericUtils.setProperty(data, 'flags.cat.macros.combat', [{source: 'chris-premades', identifier: 'hemorrhaging-critical-effect', rules: '2014'}]);
        await effectUtils.createEffects(actor, [data]);
    }
}
async function bleed({document: effect, token}) {
    const {damage, type} = effect.flags['chris-premades']?.hemorrhagingCritical ?? {};
    if (damage && token) await workflowUtils.applyDamage([token], damage, type);
    await documentUtils.deleteDocument(effect);
}
export const adeptMarksman = {
    name: 'Adept Marksman',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: regain,
            priority: 50
        }
    ]
};
export const viciousIntent = {
    name: 'Vicious Intent',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: criticalRange,
            priority: 50
        }
    ]
};
export const hemorrhagingCritical = {
    name: 'Hemorrhaging Critical',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: hemorrhage,
            priority: 60
        }
    ]
};
export const hemorrhagingCriticalEffect = {
    name: 'Hemorrhaging Critical: Effect',
    version: '2.1.11',
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: bleed,
            priority: 50
        }
    ]
};
