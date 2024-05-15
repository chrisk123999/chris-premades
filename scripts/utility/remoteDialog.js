import {chris} from '../helperFunctions.js';
export async function remoteDialog(title, options, content) {
    return await chris.dialog(title, options, content);
}
export async function remoteDocumentDialog(title, uuids, displayTooltips, alphabetical, cr) {
    let documents = await Promise.all(uuids.map(async i => await fromUuid(i)));
    return await chris.selectDocument(title, documents, true, displayTooltips, alphabetical, cr);
}
export async function remoteDocumentsDialog(title, uuids, displayTooltips, alphabetical, cr) {
    let documents = await Promise.all(uuids.map(async i => await fromUuid(i)));
    return await chris.selectDocuments(title, documents, true, displayTooltips, alphabetical, cr);
}
export async function remoteAimCrosshair(tokenUuid, maxRange, icon, interval, size) {
    let token = await fromUuid(tokenUuid);
    return await chris.aimCrosshair(token, maxRange, icon, interval, size);
}
export async function remoteMenu(title, buttons, inputs, useSpecialRender, info, header, extraOptions) {
    return await chris.menu(title, buttons, inputs, useSpecialRender, info, header, extraOptions);
}
export async function remoteSelectTarget(title, buttons, targetUuids, returnUuid, type, selectOptions, fixTargets, description, coverTokenUuid, reverseCover, displayDistance) {
    let targets = await Promise.all(targetUuids.map(async i => await fromUuid(i)));
    let coverToken;
    if (coverTokenUuid) coverToken = await fromUuid(coverToken);
    return await chris.selectTarget(title, buttons, targets, returnUuid, type, selectOptions, fixTargets, description, coverToken, reverseCover, displayDistance);
}