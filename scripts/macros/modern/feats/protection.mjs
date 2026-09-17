import {documentUtils, tokenUtils} from '../../../proxy.mjs';
async function moved({document: effect, token}) {
    const other = await fromUuid(effect.flags['chris-premades']?.protection?.protector) ??
                  await fromUuid(effect.flags['chris-premades']?.protection?.protected);
    if (!other) return;
    if (tokenUtils.getDistance(token, other, {wallsBlock: true}) > 5)
        await documentUtils.deleteDocument(effect);
}
export const protectionMoved = {
    name: 'Protection: Moved',
    rules: '2024',
    version: '2.0.3',
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 100
        }
    ]
};
