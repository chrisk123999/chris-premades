import {documentUtils, effectUtils} from '../../../../proxy.mjs';
async function deleted({document}) {
    const actor = effectUtils.getActor(document);
    if (!actor?.system.attributes.hp.temp) return;
    await documentUtils.update(actor, {'system.attributes.hp.temp': 0});
}
export const braceUp = {
    name: 'Brace Up',
    version: '2.1.11',
    rules: '2024',
    effect: [
        {
            pass: 'deleted',
            macro: deleted,
            priority: 50
        }
    ]
};
