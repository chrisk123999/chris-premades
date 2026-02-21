async function early({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size !== 1) return;
    let hp = workflow.actor.system.attributes.hp;
    if (hp.pct > 50) return;
    workflow.tracker.advantage.add(item.name, item.name);
}
export let bloodiedFrenzy = {
    name: 'Bloodied Frenzy',
    translation: 'CHRISPREMADES.Macros.BloodiedFrenzy.Name',
    version: '1.3.38',
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
                macro: early,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: []
};