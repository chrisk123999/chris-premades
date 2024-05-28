async function turnEnd(trigger) {
    console.log('--- Test Turn End ---');
}
async function turnStart(trigger) {
    console.log('--- Test Turn Start ---');
}
export let test = {
    name: 'Test',
    version: '0.12.0',
    effect: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        },
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};