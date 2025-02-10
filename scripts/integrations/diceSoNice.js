async function preItemRoll(workflow) {
    if (game.settings.get('dice-so-nice', 'immediatelyDisplayChatMessages')) workflow.workflowOptions.damageRollDSN = false;
}
function damageRollComplete(workflow) {
    if (game.settings.get('dice-so-nice', 'immediatelyDisplayChatMessages')) {
        MidiQOL.displayDSNForRoll(workflow.damageRoll, 'damageRoll');
        if (workflow.bonusDamageRoll) MidiQOL.displayDSNForRoll(workflow.bonusDamageRoll, 'damageRoll');
    }
}
export let diceSoNice = {
    preItemRoll,
    damageRollComplete
};