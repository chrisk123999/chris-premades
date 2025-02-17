async function use({trigger, workflow}) {
    await workflow.actor.rollSkill({skill: 'ste'});
}
export let hide = {
    name: 'Hide',
    version: '1.1.0',
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