import {automationUtils, documentUtils, effectUtils, itemUtils, Logging, workflowUtils} from '../../../proxy.mjs';
async function targeted({document, sourceToken, workflow}) {
    if (workflow.targets.size !== 1 || !workflow.token || !workflow.activity) return;
    if (workflow.activity.target?.template?.type || workflowUtils.isSustainedRoll(workflow)) return;
    if (workflow.token.document.disposition === sourceToken.disposition) return;
    const item = effectUtils.getOriginActivitySync(document)?.item;
    if (!item) return Logging.addMacroWarning('CPR', 'sanctuary', 'Origin item missing.', {notify: 'warn'});
    const harmfulSpell = workflow.item.type === 'spell' && (documentUtils.getRules(item) === '2014' || !!workflow.activity.damage?.parts?.length);
    if (!harmfulSpell && !workflowUtils.isAttackType(workflow, 'attack')) return;
    const saveActivity = itemUtils.getActivityByIdentifier(item, 'sanctuarySave');
    if (!saveActivity) return Logging.addMacroWarning('CPR', 'sanctuary', 'Save activity missing from item.', {notify: 'warn'});
    const saveWorkflow = await workflowUtils.syntheticActivityRoll(saveActivity, [workflow.token.document], {spellSlot: false});
    if (!saveWorkflow?.failedSaves?.size) return;
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    animation?.macros.play?.(workflow.token.document, sourceToken, options);
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token.document}),
        content: _loc('CHRISPREMADES.Macros.All.Sanctuary.Failed')
    });
    workflow.aborted = true;
    return true;
}
async function cast({document, workflow}) {
    if (workflow.item?.type !== 'spell' || workflow.activity?.identifier === 'sanctuarySave') return;
    const originActivity = effectUtils.getOriginActivitySync(document);
    if (originActivity && workflow.activity?.uuid === originActivity.uuid && workflow.targets.some(token => token.actor === workflow.actor)) return;
    if (documentUtils.getRules(originActivity?.item ?? workflow.item) === '2014' && !workflow.targets.some(token => token.document.disposition !== workflow.token?.document.disposition)) return;
    await documentUtils.deleteDocument(document);
}
export const sanctuary = {
    name: 'Sanctuary',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'targetPreItemRoll',
            macro: targeted,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: cast,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'sanctuary'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
