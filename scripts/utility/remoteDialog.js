import {chris} from '../helperFunctions.js';
export async function remoteDialog(title, options, content) {
    return await chris.dialog(title, options, content);
}