import {dialogUtils, queryUtils} from '../../../../../proxy.mjs';
function compare(type, actor, targetActor) {
    if (type === 'levels') {
        const sourceLevel = actor.system.details.level;
        const targetLevel = targetActor.system.details.level;
        if (!targetLevel) return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.NoLevel');
        if (sourceLevel > targetLevel) return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.LowerLevel');
        if (targetLevel > sourceLevel) return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.HigherLevel');
        return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.EqualLevel');
    }
    const ability = _loc(CONFIG.DND5E.abilities[type].label);
    const sourceScore = actor.system.abilities[type].value;
    const targetScore = targetActor.system.abilities[type].value;
    if (sourceScore > targetScore) return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.Lower', {ability});
    if (sourceScore < targetScore) return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.Higher', {ability});
    return _loc('CHRISPREMADES.Macros.Legacy.InsightfulManipulator.Equal', {ability});
}
async function use({document, actor, workflow}) {
    if (!workflow.targets.size) return;
    const options = [
        ['CHRISPREMADES.Macros.Legacy.InsightfulManipulator.IntScore', 'int'],
        ['CHRISPREMADES.Macros.Legacy.InsightfulManipulator.WisScore', 'wis'],
        ['CHRISPREMADES.Macros.Legacy.InsightfulManipulator.ChaScore', 'cha'],
        ['CHRISPREMADES.Macros.Legacy.InsightfulManipulator.Levels', 'levels']
    ];
    const userId = queryUtils.firstOwner(actor, true);
    const first = await dialogUtils.buttonDialog(document.name, 'CHRISPREMADES.Macros.Legacy.InsightfulManipulator.Select', options, {userId});
    if (!first) return;
    const second = await dialogUtils.buttonDialog(document.name, 'CHRISPREMADES.Macros.Legacy.InsightfulManipulator.Select', options.filter(option => option[1] !== first), {userId});
    if (!second) return;
    const targetActor = workflow.targets.first().actor;
    const content = [compare(first, actor, targetActor), compare(second, actor, targetActor)].join('<br>');
    const gmIds = game.users.filter(user => user.isGM).map(user => user.id);
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({actor, token: workflow.token?.document}),
        content,
        whisper: [...new Set([...gmIds, game.user.id])]
    });
}
export const insightfulManipulator = {
    name: 'Insightful Manipulator',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
