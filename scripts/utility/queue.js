import Heap from '../heap/priority-queue.js';
let allQueues = {};
function add(uuid, key, priority) {
    if (!game.settings.get('chris-premades', 'Priority Queue')) return;
    if (allQueues[uuid] === undefined) {
        allQueues[uuid] = new Heap();
    }
    return allQueues[uuid].enqueue([priority, key]);
}
async function wait(uuid, key) {
    if (!game.settings.get('chris-premades', 'Priority Queue')) return true;
    let currentKey = allQueues[uuid].peek()[1];
    let stacks = 0;
    while (currentKey != key) {
        stacks++;
        if (stacks >= 300) {
            console.error('Chris | Queue time took too long and was removed!');
            delete(allQueues[uuid]);
            return false;
        }
        await warpgate.wait(1000);
        currentKey = allQueues[uuid].peek()[1]
    }
    return true;
}
function remove(uuid) {
    if (!game.settings.get('chris-premades', 'Priority Queue')) return;
    allQueues[uuid]?.dequeue();
    if (allQueues[uuid]?.size === 0) delete(allQueues[uuid]);
    return true;
}
function state(uuid) {
    if (!game.settings.get('chris-premades', 'Priority Queue')) return;
    let queue = allQueues[uuid];
    if (!queue) return false;
    if (queue.size === 0) return false;
    return allQueues[uuid].peek()[1];
}
function purge() {
    allQueues = {};
}
async function setup(uuid, key, priority) {
    if (!game.settings.get('chris-premades', 'Priority Queue')) return true;
    queue.add(uuid, key, priority);
    await warpgate.wait(100);
    return await queue.wait(uuid, key);
}
function status() {
    return allQueues;
}
export let queue = {
    'add': add,
    'wait': wait,
    'remove': remove,
    'state': state,
    'purge': purge,
    'setup': setup,
    'status': status
}
/*
001-100: Item attack roll and damage modifcation.
101-200: Class & race feature attack roll and damage modifcation.
201-300: On Hit Bonus Damage
301-400: Damage Rewriting
401:500: On Hit Triggers
*/