import {documentUtils} from '../../../../proxy.mjs';
async function short({actor}) {
    if (!actor) return;
    const exhaustion = actor.system.attributes.exhaustion;
    if (!exhaustion) return;
    await documentUtils.update(actor, {'system.attributes.exhaustion': exhaustion - 1});
}
export const tireless = {
    name: 'Tireless',
    version: '2.1.4',
    rules: '2024',
    rest: [
        {
            pass: 'actorShort',
            macro: short,
            priority: 50
        }
    ]
};
