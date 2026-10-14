import {automationUtils, documentUtils, effectUtils, Logging, tokenUtils} from '../../../proxy.mjs';
export function getConfig(document, key) {
    return automationUtils.getOriginConfigValue(document, key) ?? mirrorImage.config[key].default;
}
export function getRemaining(effect) {
    return Math.max(0, Number(getConfig(effect, 'duplicates')) - (effect.flags['chris-premades']?.mirrorImage?.destroyed ?? 0));
}
async function rollDuplicates(effect, sourceToken, formula) {
    const roll = await new Roll(formula).evaluate();
    await roll.toMessage({speaker: ChatMessage.implementation.getSpeaker({token: sourceToken}), flavor: effect.name});
    return roll.total;
}
async function report(workflow, key) {
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token.document}),
        content: _loc('CHRISPREMADES.Macros.All.MirrorImage.' + key)
    });
}
function playAnimation(item, workflow, sourceToken, effect, index, missed) {
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    animation?.macros.play?.(workflow.token.document, sourceToken, {...options, effect, index, missed});
}
async function destroyDuplicate(effect, item, workflow, sourceToken, remaining) {
    playAnimation(item, workflow, sourceToken, effect, remaining - 1, false);
    if (remaining <= 1) await documentUtils.deleteDocument(effect);
    else await documentUtils.setFlag(effect, 'chris-premades', 'mirrorImage.destroyed', (effect.flags['chris-premades']?.mirrorImage?.destroyed ?? 0) + 1);
}
async function attacked({document: effect, sourceToken, workflow}) {
    if (!workflow.token || workflow.token.document === sourceToken || workflow.isFumble) return;
    if (!tokenUtils.canSee(workflow.token.document, sourceToken)) return;
    if (tokenUtils.canSense(workflow.token.document, sourceToken, ['blindsight', 'seeAll'])) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return Logging.addMacroWarning('CPR', 'mirror-image', 'Origin item missing.', {notify: 'warn'});
    const remaining = getRemaining(effect);
    if (!remaining) return;
    if (documentUtils.getRules(item) === '2014') {
        if (workflow.targets.size !== 1) return;
        const thresholds = String(getConfig(effect, 'thresholds')).split(',').map(value => Number(value.trim()));
        const needed = thresholds[Math.min(remaining, thresholds.length) - 1];
        const total = await rollDuplicates(effect, sourceToken, '1d20');
        if (total < needed) return;
        workflow.hitTargets.delete(sourceToken.object);
        const duplicateAC = Number(getConfig(effect, 'duplicateBaseAC')) + sourceToken.actor.system.abilities.dex.mod;
        if (workflow.attackRoll.total < duplicateAC) {
            playAnimation(item, workflow, sourceToken, effect, remaining - 1, true);
            await report(workflow, 'Miss');
            return;
        }
    } else {
        if (workflow.hitTargets.size !== 1 || !workflow.hitTargets.has(sourceToken.object)) return;
        const formula = remaining + getConfig(effect, 'dieSize') + 'cs>=' + getConfig(effect, 'threshold');
        if (!await rollDuplicates(effect, sourceToken, formula)) return;
        workflow.hitTargets.delete(sourceToken.object);
    }
    await report(workflow, 'Hit');
    await destroyDuplicate(effect, item, workflow, sourceToken, remaining);
}
export const mirrorImage = {
    name: 'Mirror Image',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'targetAttackRollComplete',
            macro: attacked,
            priority: 50
        }
    ],
    config: {
        duplicates: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.MirrorImage.Duplicates',
            category: 'homebrew'
        },
        thresholds: {
            default: '11, 8, 6',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.MirrorImage.Thresholds',
            hint: 'CHRISPREMADES.Macros.All.MirrorImage.ThresholdsHint',
            category: 'homebrew'
        },
        dieSize: {
            default: 'd6',
            type: 'text',
            label: 'CHRISPREMADES.Config.DieSize',
            hint: 'CHRISPREMADES.Macros.All.MirrorImage.DieSizeHint',
            category: 'homebrew'
        },
        duplicateBaseAC: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.MirrorImage.DuplicateBaseAC',
            hint: 'CHRISPREMADES.Macros.All.MirrorImage.DuplicateBaseACHint',
            category: 'homebrew'
        },
        threshold: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.MirrorImage.Threshold',
            hint: 'CHRISPREMADES.Macros.All.MirrorImage.ThresholdHint',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mirrorImage'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
