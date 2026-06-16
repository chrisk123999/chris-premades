async function use({dialog}) {
    dialog.configure = false;
}
export const noConfiguration = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['Item'],
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: use,
            priority: 10
        }
    ]
};
