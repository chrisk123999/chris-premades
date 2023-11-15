import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function checkCover({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let reverseCover = workflow.targets.has(workflow.token);
    let targets;
    if (!workflow.targets.size || (workflow.targets.size === 1 && workflow.targets.has(workflow.token))) {
        targets = game.canvas.scene.tokens.map(i => i.object).filter(j => chris.canSense(workflow.token, j) && j.document.uuid != workflow.token.document.uuid && !chris.findEffect(j.actor, 'Dead') && !chris.findEffect(j.actor, 'Unconscious'));
    } else {
        targets = Array.from(workflow.targets);
    }
    let text = reverseCover ? 'Your Cover:' : 'Target Cover:';
    let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, targets, false, 'multiple', false, false, text, workflow.token, reverseCover);
    if (!selection.buttons) return;
    chris.updateTargets(selection.inputs);
}