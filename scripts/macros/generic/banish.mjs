import {actorUtils, documentUtils, effectUtils} from '../../proxy.mjs';
async function setHidden(effect, hidden) {
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    await Promise.all(actorUtils.getTokens(actor).filter(token => token.hidden !== hidden).map(token => documentUtils.update(token, {hidden})));
}
async function created({document}) {
    await setHidden(document, true);
}
async function deleted({document}) {
    await setHidden(document, false);
}
export const banish = {
    rules: 'all',
    version: '2.0.4',
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
    ]
};
