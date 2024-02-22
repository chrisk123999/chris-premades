import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function maxDamage({speaker, actor, token, character, item, args, scope, workflow}) {
    Hooks.once('midi-qol.DamageRollComplete', async (workflow) => {
        let queueSetup = await queue.setup(workflow.item.uuid, 'maxDamage', 450);
        if (!queueSetup) return;
        await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
            arr[i] = await damageRoll.reroll({'maximize': true});
        }));
        await workflow.setDamageRolls(workflow.damageRolls);
        queue.remove(workflow.item.uuid);
    });
}
async function multiplyDamage(multiplier) {
    Hooks.once('midi-qol.DamageRollComplete', async (workflow) => {
        let queueSetup = await queue.setup(workflow.item.uuid, 'multiplyDamage', 450);
        if (!queueSetup) return;
        await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
            arr[i] = await chris.damageRoll(workflow, '(' + damageRoll._formula + ') * ' + multiplier, undefined, true);
        }));
        await workflow.setDamageRolls(workflow.damageRolls);
        queue.remove(workflow.item.uuid);
    });
}
async function doubleDamage({speaker, actor, token, character, item, args, scope, workflow}) {
    await multiplyDamage(2);
}
async function tripleDamage({speaker, actor, token, character, item, args, scope, workflow}) {
    await multiplyDamage(3);
}
export let examples = {
    'maxDamage': maxDamage,
    'doubleDamage': doubleDamage,
    'tripleDamage': tripleDamage
}