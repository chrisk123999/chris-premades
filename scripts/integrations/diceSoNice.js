async function early(workflow) {
    workflow.workflowOptions.damageRollDSN = false;
}
async function late(workflow) {
    MidiQOL.displayDSNForRoll(workflow.damageRoll, 'damageRoll');
    if(workflow.bonusDamageRoll) MidiQOL.displayDSNForRoll(workflow.bonusDamageRoll, 'damageRoll');
}
export let diceSoNice = {
    early: early,
    late: late
}