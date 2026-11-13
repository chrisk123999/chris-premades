import {automationUtils, dialogUtils, documentUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function prompt({document: activity, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflowUtils.isSustainedRoll(workflow)) return;
    if (workflow.activity.activation.type !== 'action') return;
    if (!automationUtils.getConfigValue(activity.item, 'prompt')) return;
    const rules = documentUtils.getRules(activity.item);
    if (rules === '2014') {
        const source = itemUtils.getAdvancementSourceItem(activity.item);
        if (source && itemUtils.getAdvancementSourceItem(workflow.item)?.uuid !== source.uuid) return;
    }
    const choice = await select(activity, `
        <div>${_loc('CAT.Dialog.Use', {document: activity.item.name})}</div>
        ${_loc('CHRISPREMADES.Macros.Legacy.DedicatedWeapon.Choose')}
    `);
    if (!choice) return;
    const options = {};
    const target = workflow.targets.documents[0];
    workflowUtils.setWorkflowProperty(options, 'battleMagicPreselected', choice.uuid);
    await workflowUtils.syntheticActivityRoll(activity, target ? [target]: [], {options});
}
async function use({document: activity, config}) {
    let selected = await fromUuid(workflowUtils.getWorkflowProperty(config.workflow, 'battleMagicPreselected'));
    selected ??= await select(activity, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.Choose');
    if (selected) await workflowUtils.specialItemUse(selected, [], activity.item);
    else return true;
}
async function select(activity, prompt) {
    const weapons = activity.actor.itemTypes.weapon;
    if (!weapons.length) return Logging.addMacroWarning('chris-premades', 'battle-magic', 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', {notify: true});
    return await dialogUtils.selectDocumentDialog(activity.item.name, prompt, weapons, {displayTooltips: true, addNoneDocument: true});
}
export const battleMagic = {
    name: 'Battle Magic',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: prompt,
            priority: 275
        },
        {
            pass: 'activityPreTargeting',
            macro: use,
            priority: 50
        }
    ],
    config: {
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse'
        }
    }
};
