import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function turnStart(token, origin) {
    let tempHP = chris.getSpellMod(origin);
    await chris.applyDamage([token], tempHP, 'temphp');
}
async function end(actor) {
    await actor.update({'system.attributes.hp.temp': 0});
}
async function early({speaker, actor, token, character, item, args, scope, workflow}) {
    let castLevel = workflow.castData.castLevel;
    if (workflow.targets.size <= castLevel) return;
    let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, Array.from(workflow.targets), false, 'multiple', undefined, false, 'Too many targets selected. Choose which targets to keep (Max: ' + castLevel + ')');
    if (!selection.buttons) return;
    let newTargets = selection.inputs.filter(i => i).slice(0, castLevel);
    chris.updateTargets(newTargets);
}
export let heroism = {
    'turnStart': turnStart,
    'end': end,
    'early': early
}