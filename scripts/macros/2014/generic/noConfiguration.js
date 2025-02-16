async function use({dialog}) {
    dialog.configure = false;
}
export let noConfiguration = {
    name: 'No Configuration',
    version: '1.1.2',
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