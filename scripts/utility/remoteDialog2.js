import {chris} from '../helperFunctions.js';
export async function remoteDialog(title, options) {
    return await chris.dialog(title, options);
}