import {actorUtils, documentUtils, effectUtils} from '../../../../../proxy.mjs';
import {resizeEffect} from '../../../../all/spells/enlargeReduce.mjs';
async function created({document}) {
    const actor = effectUtils.getActor(document);
    if (!actor || document.system.changes.some(change => ['system.traits.size', 'flags.midi-qol.range.mwak'].includes(change.key))) return;
    const sizes = Object.keys(CONFIG.DND5E.actorSizes);
    const juggernaut = !!actorUtils.getItemByIdentifier(actor, 'runic-juggernaut');
    const newSize = juggernaut ? 'huge' : 'lg';
    const extraChanges = juggernaut ? [{key: 'flags.midi-qol.range.mwak', type: 'add', value: '5', phase: 'initial', priority: 20}] : [];
    if (sizes.indexOf(actor.system.traits.size) < sizes.indexOf(newSize)) await resizeEffect(document, actor, newSize, {extraChanges});
    else if (juggernaut) await documentUtils.update(document, {'system.changes': [...document.toObject().system.changes, ...extraChanges]});
}
export const giantsMight = {
    name: 'Giant\'s Might',
    version: '2.1.11',
    rules: '2014',
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        }
    ]
};
