async function early(workflow) {
    workflow.workflowOptions.damageRollDSN = false
}
async function late(workflow) {
    MidiQOL.displayDSNForRoll(workflow.damageRoll, 'damageRoll')
}
export let diceSoNice = {
    early: early,
    late: late
}