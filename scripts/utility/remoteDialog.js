import {chris} from '../helperFunctions.js';
export async function remoteDialog(title, options, content) {
    return await chris.dialog(title, options, content);
}
export async function remoteDocumentDialog(title, uuids) {
    let documents = [];
    for (let i of uuids) {
        documents.push(await fromUuid(i));
    }
    return await chris.selectDocument(title, documents, true);
}
export async function remoteDocumentsDialog(title, uuids) {
    let documents = [];
    for (let i of uuids) {
        documents.push(await fromUuid(i));
    }
    return await chris.selectDocuments(title, documents, true);
}