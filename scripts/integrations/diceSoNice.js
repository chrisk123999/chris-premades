async function preItemRoll(workflow) {
    workflow.workflowOptions.damageRollDSN = false;
}
async function damageRollComplete(workflow) {
    let damageRolls = [...workflow.damageRolls, ...(workflow.bonusDamageRolls ?? []), ...(workflow.otherDamageRolls ?? [])];
    await MidiQOL.displayDSNForRoll(damageRolls, 'damageRoll');
}
export let diceSoNice = {
    preItemRoll,
    damageRollComplete
};