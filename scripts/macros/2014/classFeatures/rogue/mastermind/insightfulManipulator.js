import {dialogUtils, genericUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let options = [
        ['CHRISPREMADES.Macros.InsightfulManipulator.IntScore', 'int'],
        ['CHRISPREMADES.Macros.InsightfulManipulator.WisScore', 'wis'],
        ['CHRISPREMADES.Macros.InsightfulManipulator.ChaScore', 'cha'],
        ['CHRISPREMADES.Macros.InsightfulManipulator.Levels', 'levels']
    ];
    let first = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.InsightfulManipulator.Select', options, {displayAsRows: true});
    if (!first) return;
    let second = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.InsightfulManipulator.Select', options.filter(i => i[1] != first), {displayAsRows: true});
    if (!second) return;
    let message = '';
    function makeMessage(type) {
        switch(type) {
            case 'int':
            case 'wis':
            case 'cha': {
                let sourceScore = workflow.actor.system.abilities[type].value;
                let targetScore = workflow.targets.first().actor.system.abilities[type].value;
                if (sourceScore > targetScore) {
                    message += genericUtils.format('CHRISPREMADES.Macros.InsightfulManipulator.Lower', {ability: genericUtils.translate('DND5E.Ability' + type.capitalize())});
                } else if (sourceScore < targetScore) {
                    message += genericUtils.format('CHRISPREMADES.Macros.InsightfulManipulator.Higher', {ability: genericUtils.translate('DND5E.Ability' + type.capitalize())});
                } else {
                    message += genericUtils.format('CHRISPREMADES.Macros.InsightfulManipulator.Equal', {ability: genericUtils.translate('DND5E.Ability' + type.capitalize())});
                }
                break;
            }
            case 'levels': {
                let sourceLevel = workflow.actor.system.details.level;
                let targetLevel = workflow.targets.first().actor.system.details.level;
                if (!targetLevel) {
                    message += genericUtils.translate('CHRISPREMADES.Macros.InsightfulManipulator.NoLevel');
                } else if (sourceLevel > targetLevel) {
                    message += genericUtils.translate('CHRISPREMADES.Macros.InsightfulManipulator.LowerLevel');
                } else if (targetLevel > sourceLevel) {
                    message += genericUtils.translate('CHRISPREMADES.Macros.InsightfulManipulator.HigherLevel');
                } else {
                    message += genericUtils.translate('CHRISPREMADES.Macros.InsightfulManipulator.EqualLevel');
                }
            }
        }
    }
    makeMessage(first);
    message += '<br>';
    makeMessage(second);
    message = await ChatMessage.create({
        speaker: workflow.chatCard.speaker,
        content: message,
        whisper: [game.user.id]
    });
}
export let insightfulManipulator = {
    name: 'Insightful Manipulator',
    version: '1.3.130',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};