async function use(workflow) {

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
                pass: 'RollComplete',
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
                pass: 'RollComplete',
                macro: move,
                priority: 50
            }
        ]
    }
};