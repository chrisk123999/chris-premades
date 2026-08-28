import {actorUtils, itemUtils} from '../../../../../proxy.mjs';
async function early({workflow}) {
    if (!workflow.targets.size) return;
    const levels = itemUtils.getAdvancementSourceItem(workflow.item)?.system?.levels ?? workflow.actor.classes.wizard?.system?.levels;
    if (!levels) return;
    const maxSize = levels >= 10 ? 4 : 3;
    const invalid = [...workflow.targets].filter(token => actorUtils.getSize(token.actor) > maxSize);
    if (!invalid.length) return;
    canvas.tokens.setTargets(invalid.map(token => token.id), {mode: 'release'});
    workflow.setTargets(new Set([...workflow.targets].filter(token => !invalid.includes(token))));
}
export const adjustDensity = {
    name: 'Adjust Density',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemTargeting',
            macro: early,
            priority: 50
        }
    ]
};
