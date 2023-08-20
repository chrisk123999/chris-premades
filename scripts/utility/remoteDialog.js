import {chris} from '../helperFunctions.js';
export async function remoteDialog(title, options, content) {
    return await chris.dialog(title, options, content);
}
export async function remoteDocumentDialog(title, documents) {
    return await chris.selectDocument(title, documents);
}
export async function remoteDocumentsDialog(title, documents) {
    return await chris.selectDocuments(title, documents);
}