import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function feyStep({document, workflow}) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    await tokenUtils.teleportToken(workflow.token.document, {range: workflow.activity.range.value, animation, options});
    const moodItem = actorUtils.getItemByIdentifiers(workflow.actor, ['summon-fey-fuming', 'summon-fey-mirthful', 'summon-fey-tricksy-legacy', 'summon-fey-tricksy-modern']);
    if (!moodItem) return;
    const identifier = documentUtils.getIdentifier(moodItem);
    if (identifier === 'summon-fey-fuming') {
        await workflowUtils.completeItemUse(moodItem);
        return;
    }
    if (identifier !== 'summon-fey-mirthful') {
        await workflowUtils.syntheticItemRoll(moodItem);
        return;
    }
    const nearby = tokenUtils.findNearby(workflow.token.document, 10, {disposition: 'enemy'});
    if (!nearby.length) return;
    const selection = await dialogUtils.selectTargetDialog(document.name + ': ' + moodItem.name, 'CHRISPREMADES.Macros.All.SummonFey.Select', nearby);
    if (!selection?.result) return;
    await workflowUtils.syntheticItemRoll(moodItem, [selection.result]);
}
export const summonFey = {
    name: 'Summon Fey',
    version: '2.1.3',
    rules: 'all',
    config: {
        useRealDarkness: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.RealDarkness',
            category: 'mechanics'
        },
        darknessAnimation: cprConstants.darknessAnimationConfig
    }
};
export const summonFeyFeyStep = {
    name: 'Fey Step',
    version: '2.0.0',
    rules: summonFey.rules,
    roll: [
        {pass: 'itemRollFinished', macro: feyStep, priority: 50}
    ],
    config: {
        animation: {
            default: {source: 'chris-premades', identifier: 'mistyStep'},
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
