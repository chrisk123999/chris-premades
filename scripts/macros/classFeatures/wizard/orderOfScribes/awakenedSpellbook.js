import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function awakenedSpellbook({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0 || workflow.item.type != 'spell') return;
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'awakenedSpellbook', 101);
    if (!queueSetup) return;
    let oldDamageRoll = workflow.damageRoll;
    let oldFlavor = oldDamageRoll.terms?.map(term=>term?.flavor)
    let spells = workflow.actor.items.filter(i => i.type === 'spell' && i.system?.level === spellLevel && i.system?.damage?.parts?.length > 0);
    let values = [];
    for (let i = 0; spells.length > i; i++) {
        let currentItem = spells[i];
        for (let j = 0; currentItem.system.damage.parts.length > j; j++) {
            let flavor = currentItem.system.damage.parts[j][1];
            if (!flavor) break;
            if (values.includes(flavor.toLowerCase()) === false && flavor != 'healing' && flavor != 'temphp' && flavor != 'none' && flavor != 'midi-none') values.push(flavor);
        }
    }
    if (values.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    function valuesToOptions(arr) {
        let optionsPush = [];
        for (let i = 0; arr.length > i; i++) {
            if (typeof arr[i] != 'string') return;
            optionsPush.push([arr[i].charAt(0).toUpperCase() + arr[i].slice(1), arr[i]]);
        }
        return optionsPush;
    }
    let options = valuesToOptions(values);
    if (options.length < 2) {
        queue.remove(workflow.item.uuid);
        return;
    }
    options.push(['No', false]);
    let selection = await chris.dialog('Change damage type for ' + workflow.item.name + '?', options);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    for (let i = 0; oldFlavor.length > i; i++) {
        workflow.damageRoll.terms[i].options.flavor = selection;
        if (oldFlavor[i]) {
            workflow.damageRoll._formula = workflow.damageRoll._formula.replace(oldFlavor[i], selection);
        }
    }
    await workflow.setDamageRoll(workflow.damageRoll);
    queue.remove(workflow.item.uuid);
}