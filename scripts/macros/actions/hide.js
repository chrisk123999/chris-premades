async function use({trigger, workflow}) {
    await workflow.actor.rollSkill('ste');
}
export let hide = {
    name: 'Hide',
    version: '0.12.12',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};