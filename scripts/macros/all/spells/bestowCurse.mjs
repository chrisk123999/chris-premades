import {dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
import {abilityOptions} from './hex.mjs';
const durations = {3: 60, 4: 600, 5: 28800, 6: 28800, 7: 86400, 8: 86400};
const curseEffects = {
    'bestow-curse-ability': 'bestowCurseAbilE',
    'bestow-curse-damage': 'bestowCurseDmgE1',
    'bestow-curse-attack': 'bestowCurseAttkE',
    'bestow-curse-turn': 'bestowCurseTurnE',
    'bestow-curse-other': 'bestowCurseOthrE'
};
async function use({document: item, workflow}) {
    const effectId = curseEffects[workflow.activity.identifier];
    if (!effectId) return;
    if (!workflow.failedSaves.size) return;
    const castLevel = workflowUtils.getCastLevel(workflow);
    const duration = {value: durations[castLevel] ?? null, units: 'seconds'};
    let concentration = effectUtils.getConcentrationEffect(workflow.actor, item);
    if (concentration && castLevel >= 5) {
        await effectUtils.endConcentration(workflow.actor, item);
        concentration = undefined;
    } else if (concentration) await documentUtils.update(concentration, {duration});
    const effectData = documentUtils.getEffectData(workflow.activity, effectId, {duration, parentEntity: concentration, activityUuid: workflow.activity.uuid});
    if (!effectData) return;
    if (effectId === 'bestowCurseAbilE') {
        const ability = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.All.BestowCurse.Ability', abilityOptions(), {userId: queryUtils.firstOwner(workflow.actor, true)});
        if (!ability) return;
        effectData.system.changes = ['check', 'save'].map(type => ({key: `flags.midi-qol.disadvantage.ability.${type}.${ability}`, type: 'custom', value: '1', priority: 20}));
    }
    if (effectId === 'bestowCurseDmgE1') {
        const sourceData = documentUtils.getEffectData(workflow.activity, 'bestowCurseSrcE1', {duration, parentEntity: concentration, activityUuid: workflow.activity.uuid});
        if (sourceData) await effectUtils.createEffects(workflow.actor, [sourceData]);
    }
    await Promise.all(Array.from(workflow.failedSaves, token => effectUtils.createEffects(token.actor, [genericUtils.deepClone(effectData)])));
}
function attack({document: effect, workflow}) {
    const sourceActor = effectUtils.getOriginActivitySync(effect)?.actor;
    if (sourceActor && workflow.targets.some(token => token.actor === sourceActor)) workflow.tracker.disadvantage.add('bestow-curse', effect.name);
}
export const bestowCurse = {
    name: 'Bestow Curse',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
export const bestowCurseAttack = {
    name: 'Bestow Curse: Attack',
    version: bestowCurse.version,
    rules: bestowCurse.rules,
    roll: [
        {pass: 'actorAttackRollConfig', macro: attack, priority: 50}
    ]
};
