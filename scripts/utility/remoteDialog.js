import {chris} from '../helperFunctions.js';
export async function remoteDialog(title, options, content) {
    return await chris.dialog(title, options, content);
}
export async function remoteDocumentDialog(title, uuids, displayTooltips) {
    let documents = await Promise.all(uuids.map(async i => await fromUuid(i)));
    return await chris.selectDocument(title, documents, true, displayTooltips);
}
export async function remoteDocumentsDialog(title, uuids, displayTooltips) {
    let documents = await Promise.all(uuids.map(async i => await fromUuid(i)));
    return await chris.selectDocuments(title, documents, true, displayTooltips);
}
export async function remoteAimCrosshair(tokenUuid, maxRange, icon, interval, size) {
    let token = await fromUuid(tokenUuid);
    return await chris.aimCrosshair(token, maxRange, icon, interval, size);
}
export async function remoteMenu(title, buttons, inputs, useSpecialRender, info, header, extraOptions) {
    return await chris.menu(title, buttons, inputs, useSpecialRender, info, header, extraOptions);
}