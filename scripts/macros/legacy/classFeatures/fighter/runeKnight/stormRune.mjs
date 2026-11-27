import {actorUtils, dialogUtils, effectUtils, queryUtils, tokenUtils} from '../../../../../proxy.mjs';
async function prompt(effect, token, label) {
    const actor = effectUtils.getActor(effect);
    if (!actor || !token || actorUtils.hasUsedReaction(actor) || actor.statuses.has('incapacitated')) return;
    const owner = actorUtils.getFirstToken(actor);
    if (!owner || (owner !== token && (!tokenUtils.isWithinDistance(owner, token, 60) || !tokenUtils.canSee(owner, token)))) return;
    const selection = await dialogUtils.buttonDialog(effect.name, _loc('CHRISPREMADES.Macros.Legacy.StormRune.AdvDis', {tokenName: token.name, actionType: label}), [
        ['DND5E.Advantage', 'advantage'],
        ['DND5E.Disadvantage', 'disadvantage'],
        ['DND5E.None', false]
    ], {userId: queryUtils.firstOwner(actor, true)});
    if (!selection) return;
    await actorUtils.setReactionUsed(actor);
    return selection;
}
async function attack({document: effect, workflow}) {
    if (!workflow.token) return;
    const selection = await prompt(effect, workflow.token.document, _loc('DND5E.AttackRoll'));
    if (selection) workflow.tracker[selection].add('storm-rune', effect.name);
}
async function d20({actor, document: effect, options}, label) {
    if (!actor) return;
    const selection = await prompt(effect, actorUtils.getFirstToken(actor), label);
    if (selection) options[selection] = true;
}
export const stormRune = {
    name: 'Storm Rune',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {pass: 'sceneAttackRollConfig', macro: attack, priority: 270}
    ],
    save: [
        {pass: 'sceneSituational', macro: args => d20(args, _loc('DND5E.SavingThrow')), priority: 270}
    ],
    check: [
        {pass: 'sceneSituational', macro: args => d20(args, _loc('DND5E.ActionAbil')), priority: 270}
    ],
    skill: [
        {pass: 'sceneSituational', macro: args => d20(args, _loc('DND5E.ActionAbil')), priority: 270}
    ],
    tool: [
        {pass: 'sceneSituational', macro: args => d20(args, _loc('DND5E.ActionAbil')), priority: 270}
    ]
};
