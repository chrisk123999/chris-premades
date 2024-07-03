import {genericUtils} from '../utils.js';
async function updateAttachments(token, delta) {
    let attachedEntityUuids = token.flags['chris-premades']?.attached?.attachedEntityUuids ?? [];
    let removedEntityUuids = [];
    await Promise.all(attachedEntityUuids.map(async templateUuid => {
        let entity = await fromUuid(templateUuid);
        if (!entity) removedEntityUuids.push(templateUuid);
        await genericUtils.update(entity, {
            x: entity.x + delta.x,
            y: entity.y + delta.y
        });
    }));
    if (removedEntityUuids.length) await genericUtils.setFlag(token, 'chris-premades.attached.attachedEntityUuids', attachedEntityUuids.filter(i => removedEntityUuids.includes(i)));
}
export let attach = {
    updateAttachments
};