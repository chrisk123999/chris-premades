import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function massCureWounds({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let sourceDisposition = workflow.token.document.disposition;
    let targetTokens = [];
    for (let i of workflow.targets) {
        if (i.document.disposition === sourceDisposition) targetTokens.push(i);
    }
    if (!targetTokens.length) return;
    let damageFormula = workflow.castData.castLevel + 'd8[healing] + ' + chris.getSpellMod(workflow.item);
    let damageRoll = await new Roll(damageFormula).roll({'async': true});
    if (targetTokens.length <= 6) {
        await chris.applyWorkflowDamage(workflow.token, damageRoll, 'healing', targetTokens, workflow.item.name, workflow.itemCardId);
    } else {
        let selection = await chris.selectTarget('What targets would you like to heal? Max: 6', constants.okCancel, targetTokens, true, 'multiple');
        if (!selection.buttons) return;
        let selectedTokens = [];
        for (let i of selection.inputs) {
            if (i) selectedTokens.push(await fromUuid(i));
        }
        if (selectedTokens.length > 6) {
            ui.notifications.info('Too many targets selected!');
            return;
        }
        chris.applyWorkflowDamage(workflow.token, damageRoll, 'healing', selectedTokens, workflow.item.name, workflow.itemCardId);
    }
}