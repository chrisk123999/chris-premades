import {actorUtils} from '../../../proxy.mjs';
import {spareDesignated, wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
async function spare({document: item, workflow}) {
    if (!['wall-of-gloom-dread', 'wall-of-gloom-drain'].includes(workflow.activity.identifier)) return;
    return spareDesignated(item, workflow);
}
async function drain({workflow}) {
    if (workflow.activity.identifier !== 'wall-of-gloom-drain') return;
    await Promise.all(Array.from(workflow.failedSaves, token => token.actor && actorUtils.addExhaustion(token.actor)));
}
export const wallOfGloom = wallMacro({
    name: 'Wall of Gloom',
    roll: [
        {pass: 'itemPreambleComplete', macro: spare, priority: 40},
        {pass: 'itemRollFinished', macro: drain, priority: 50}
    ]
}, {
    animation: 'wall',
    freeDraw: true,
    shapes: {
        'wall-of-gloom': {shape: {maxLength: 60}, height: 10},
        'wall-of-gloom-ring': {shape: {ring: {maxDiameter: 20, minDiameter: 20}}, height: 20}
    },
    options: () => ({
        thickness: 5,
        walls: 'opaque',
        color: '#5a5a6e',
        timer: 100,
        designate: true,
        light: {bright: 0, dim: 100, color: '#8a8aa0', alpha: 0.2},
        aura: {identifier: 'wall-of-gloom-dread', distance: 20, color: '#3c3c4a', name: _loc('CHRISPREMADES.Macros.Generic.Wall.Zone')},
        draw: {highlightTokens: {path: 0x8a8aa0}, summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewInside')}
    })
});
