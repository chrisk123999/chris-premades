async function use({trigger, workflow}) {
    workflow.options.configureDialog = false;
}
export let noConfiguration = {
    name: 'No Configuration',
    version: '0.12.26',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: use,
                priority: 10
            }
        ]
    }
};