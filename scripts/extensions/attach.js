import {genericUtils} from '../utils.js';
async function updateAttachments(entity, delta) {
    let attachedEntityUuids = entity.flags['chris-premades']?.attached?.attachedEntityUuids ?? [];
    let removedEntityUuids = [];
    await Promise.all(attachedEntityUuids.map(async uuid => {
        let document = await fromUuid(uuid);
        if (!document) {
            removedEntityUuids.push(uuid);
        } else {
            let updates = {
                x: document.x + delta.x,
                y: document.y + delta.y
            };
            if (document.documentName === 'Token' && entity.documentName === 'Token'  && document.sort <= entity.sort) updates.sort = entity.sort + 1;
            await genericUtils.update(document, updates, {animate: false});
        }
    }));
    if (removedEntityUuids.length) await genericUtils.setFlag(document, 'chris-premades', 'attached.attachedEntityUuids', attachedEntityUuids.filter(i => !removedEntityUuids.includes(i)));
}
export let attach = {
    updateAttachments
};