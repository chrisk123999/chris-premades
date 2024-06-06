async function turnEnd(trigger) {
    console.log('--- Test Turn End ---');
}
async function turnStart(trigger) {
    console.log('--- Test Turn Start ---');
}
async function moved(trigger) {
    console.log('--- Test Moved ---');
}
async function movedNear(trigger) {
    console.log('--- Test Moved Near ---');
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
    ],
    movement: [
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        },
        {
            pass: 'movedNear',
            macro: movedNear,
            priority: 50,
            distance: 2
        }
    ]
};