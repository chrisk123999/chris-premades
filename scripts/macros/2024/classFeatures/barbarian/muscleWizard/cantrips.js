import {activityUtils, actorUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function mageHand({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    let distance = effect ? 10 : 5;
    await tokenUtils.pushToken(workflow.token, workflow.targets.first(), distance);
}
async function shockingGrasp({trigger, workflow}) {
    if (!workflow.activity || !workflow.targets.size) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (effect) {
        genericUtils.setProperty(effectData, 'flags.dae.specialDuration', ['turnStartSource']);
        effectData.duration = {rounds: 2};
    } else {
        effectData.duration = {turns: 1};
    }
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.activity || !combatUtils.isOwnTurn(workflow.token)) return;
    if (workflow.activity.ability != 'str') return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!itemUtils.canUse(item)) return;
    let mageHand = activityUtils.getActivityByIdentifier(item, 'mageHand', {strict: true});
    let shockingGrasp = activityUtils.getActivityByIdentifier(item, 'shockingGrasp', {strict: true});
    let trueStrike = activityUtils.getActivityByIdentifier(item, 'trueStrike', {strict: true});
    if (!shockingGrasp || !trueStrike || !mageHand) return;
    let activities = [shockingGrasp, trueStrike];
    if (actorUtils.getSize(workflow.hitTargets.first().actor, false) <= 3) activities.unshift(mageHand);
    let selection = await dialogUtils.selectDocumentDialog(item.name, genericUtils.format('CHRISPREMADES.Generic.UseItem', {item: item.name}), activities, {addNoneDocument: true});
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(selection, [workflow.hitTargets.first()], {consumeResources: true, consumeUsage: true});
    if (selection.id != trueStrike.id) return;
    let formula = '1d6';
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (effect) {
        let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
        let levels = workflow.actor.classes[classIdentifier]?.system?.levels;
        if (levels) formula += ' + ' + Math.floor(levels / 2);
    }
    await workflowUtils.bonusDamage(workflow, formula);
}
export let cantrips = {
    name: '"Cantrips"',
    version: '1.3.91',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: mageHand,
                priority: 50,
                activities: ['mageHand']
            },
            {
                pass: 'rollFinished',
                macro: shockingGrasp,
                priority: 50,
                activities: ['shockingGrasp']
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 255
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        }
    ]
};