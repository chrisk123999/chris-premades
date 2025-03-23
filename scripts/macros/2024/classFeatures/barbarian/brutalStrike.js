import {combatUtils} from '../../../../lib/utilities/combatUtils.js';
import {activityUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (!workflow.token || !workflow.targets.size || workflow.disadvantage || (workflow.disadvantage && workflow.advantage) || !combatUtils.isOwnTurn(workflow.token) || !constants.attacks.includes(workflow.activity.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'recklessAttackEffect');
    if (!effect) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classItem = workflow.actor.classes[classIdentifier];
    if (!classItem) return;
    let barbarianLevel = classItem.system.levels;
    let activitiesIdentifiers = ['forcefulBlow', 'hamstringBlow'];
    if (barbarianLevel >= 13) {
        activitiesIdentifiers.push(...['staggeringBlow', 'sunderingBlow']);
    }
    let activities = activitiesIdentifiers.map(i => activityUtils.getActivityByIdentifier(item, i, {strict: true}));
    let selections;
    if (barbarianLevel >= 17) {
        let selection = await dialogUtils.selectDocumentsDialog(item.name, genericUtils.format('CHRISPREMADES.Macros.BrutalStrike.Choose', {item: item.name}), activities, {max: 2, sortAlphabetical: true, checkbox: true});
        if (!selection) return;
        selections = selection.filter(i => i.amount).map(j => j.document);
        if (!selections.length) return;
    } else {
        let selection = await dialogUtils.selectDocumentDialog(item.name, genericUtils.format('CHRISPREMADES.Macros.BrutalStrike.Choose', {item: item.name}), activities, {sortAlphabetical: true, addNoneDocument: true});
        if (!selection) return;
        selections = [selection];
    }
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    genericUtils.setProperty(workflow, 'chris-premades.brutalStrike', selections.map(i => activityUtils.getIdentifier(i)));
    workflow.advantage = false;
    workflow.rollOptions.advantage = false;
    workflow.attackAdvAttribution.add('DIS:' + item.name);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    let activitiesIdentifiers = workflow['chris-premades']?.brutalStrike;
    if (!activitiesIdentifiers) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classItem = workflow.actor.classes[classIdentifier];
    if (!classItem) return;
    let barbarianLevel = classItem.system.levels;
    let formula = (barbarianLevel >= 17 ? 2 : 1) + 'd10';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: workflow.defaultDamageType});
}
async function late({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let activitiesIdentifiers = workflow['chris-premades']?.brutalStrike;
    if (!activitiesIdentifiers) return;
    let activities = activitiesIdentifiers.map(i => activityUtils.getActivityByIdentifier(item, i, {strict: true}));
    for (let activity of activities) {
        await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.first()]);
    }
}
async function forcefulBlow({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    await tokenUtils.pushToken(workflow.token, workflow.targets.first(), 15);
}
async function sunderingBlowAttacked({trigger: {entity: effect}, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!effect.origin) return;
    let origin = await effectUtils.getOriginItem(effect);
    if (!origin?.actor) return;
    if (workflow.actor.id === origin.actor.id) return;
    await workflowUtils.bonusAttack(workflow, '5');
    await genericUtils.remove(effect);
}
export let brutalStrike = {
    name: 'Brutal Strike',
    version: '1.1.22',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: forcefulBlow,
                priority: 50,
                activities: ['forcefulBlow']
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 250
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
export let sunderingBlow = {
    name: 'Sundering Blow',
    version: brutalStrike.version,
    rules: brutalStrike.rules,
    midi: {
        actor: [
            {
                pass: 'targetPostAttackRoll',
                macro: sunderingBlowAttacked,
                priority: 50
            }
        ]
    }
};