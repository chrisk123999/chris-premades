import {actorUtils, automationUtils, documentUtils, effectUtils} from '../../../proxy.mjs';
async function created({document}) {
    const actor = effectUtils.getActor(document);
    if (!actor || document.system.changes.some(change => change.key === 'system.traits.size')) return;
    const enlarge = documentUtils.getIdentifier(document) === 'enlarge';
    const sizes = Object.keys(CONFIG.DND5E.actorSizes);
    const origSize = actor.system.traits.size;
    const newSize = sizes[Math.clamp(sizes.indexOf(origSize) + (enlarge ? 1 : -1) * automationUtils.getOriginConfigValue(document, 'sizeSteps'), 0, sizes.length - 1)];
    const changes = document.toObject().system.changes;
    changes.push({key: 'system.traits.size', type: 'override', value: newSize, phase: 'initial', priority: 20});
    let resized = false;
    const resize = async () => {
        if (resized) return;
        resized = true;
        await documentUtils.update(document, {'system.changes': changes});
    };
    const item = effectUtils.getOriginActivitySync(document)?.item;
    const token = actorUtils.getFirstToken(actor);
    const {animation} = item ? automationUtils.getResolvedAnimation(item, 'animation') : {};
    if (token && animation?.macros?.play) {
        await animation.macros.play(token, {
            enlarge,
            preScale: CONFIG.DND5E.actorSizes[origSize]?.dynamicTokenScale ?? 1,
            postScale: CONFIG.DND5E.actorSizes[newSize]?.dynamicTokenScale ?? 1,
            callback: resize
        });
    }
    await resize();
}
export const enlargeReduce = {
    name: 'Enlarge/Reduce',
    version: '2.1.3',
    rules: 'all',
    config: {
        sizeSteps: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.EnlargeReduce.SizeSteps',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'enlargeReduce'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
export const enlargeReduceEffect = {
    name: 'Enlarge/Reduce: Effect',
    version: enlargeReduce.version,
    rules: enlargeReduce.rules,
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        }
    ]
};
