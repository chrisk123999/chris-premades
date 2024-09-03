async function preItemRoll(workflow) {
    workflow.workflowOptions.damageRollDSN = false;
}
function damageRollComplete(workflow) {
    MidiQOL.displayDSNForRoll(workflow.damageRoll, 'damageRoll');
    if (workflow.bonusDamageRoll) MidiQOL.displayDSNForRoll(workflow.bonusDamageRoll, 'damageRoll');
}
export let diceSoNice = {
    preItemRoll,
    damageRollComplete
};