export async function flanking(workflow) {
    if (!workflow.actor) return;
    if (!workflow.actor.flags['chris-premades']?.mechanic?.noFlanking) return;
    workflow.flankingAdvantage = false;
}