import {chris} from '../../helperFunctions.js';
export async function massCureWounds({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    let sourceDisposition = workflow.token.document.disposition;
    let targetTokens = [];
    for (let i of workflow.targets) {
        if (i.document.disposition === sourceDisposition) targetTokens.push(i);
    }
    if (targetTokens.length === 0) return;
    let diceNumber = 8 - workflow.castData.castLevel;
    let damageFormula = diceNumber + 'd8[healing] + ' + chris.getSpellMod(workflow.item);
    let damageRoll = await new Roll(damageFormula).roll({'async': true});
    if (targetTokens.length <= 6) {
        await chris.applyWorkflowDamage(workflow.token, damageRoll, 'healing', targetTokens, workflow.item.name, workflow.itemCardId);
    } else {
        let buttons = [
            {
                'label': 'Yes',
                'value': true
            }, {
                'label': 'No',
                'value': false
            }
        ];
        let selection = await chris.selectTarget('What targets would you like to heal? Max: 6', buttons, targetTokens, true, 'multiple');
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