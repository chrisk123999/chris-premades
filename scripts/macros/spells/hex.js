async function use(workflow) {
    if (!workflow.targets.size) return;
    console.log('here');
}
async function damage(workflow) {

}
async function move(workflow) {

}
export let hex = {
    name: 'Hex',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'postActiveEffects',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'postDamageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};
export let hexMove = {
    name: 'Hex - Move',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'postActiveEffects',
                macro: move,
                priority: 50
            }
        ]
    }
};