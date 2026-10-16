import {actorUtils, automationUtils, documentUtils, effectUtils} from '../../proxy.mjs';
function getTokens(effect, hidden) {
    const actor = effectUtils.getActor(effect);
    return actor ? actorUtils.getTokens(actor).filter(token => token.hidden !== hidden) : [];
}
function getAnimation(effect) {
    return automationUtils.getResolvedAnimation(effect, 'animation', {source: 'chris-premades', identifier: 'banish'}).animation;
}
async function created({document}) {
    const tokens = getTokens(document, true);
    const animation = getAnimation(document);
    if (animation?.macros?.banish) await Promise.all(tokens.map(token => animation.macros.banish(token)));
    await Promise.all(tokens.map(token => documentUtils.update(token, {hidden: true})));
}
async function deleted({document}) {
    if (document.flags.cat?.banish?.permanent && !(document.duration?.remaining > 0)) return;
    const tokens = getTokens(document, false);
    await Promise.all(tokens.map(token => documentUtils.update(token, {hidden: false})));
    const animation = getAnimation(document);
    if (animation?.macros?.return) await Promise.all(tokens.map(token => animation.macros.return(token)));
}
/**
 * Hides the affected actor's tokens while the effect exists and reveals them when it is deleted.
 * Bound on an effect. Fires on `created` and `deleted`.
 * An effect flagged `flags.cat.banish.permanent` that runs its full duration leaves the tokens hidden.
 *
 * Config:
 * - `animation`: played on each token before it is hidden, and again when it returns.
 */
export const banish = {
    rules: 'all',
    version: '2.1.3',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect'],
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: deleted,
            priority: 50
        }
    ],
    genericConfig: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'banishment'
            },
            type: 'selectAnimation',
            inputs: ['targetToken'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
