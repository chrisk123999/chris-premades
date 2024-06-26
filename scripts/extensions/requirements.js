import {genericUtils, itemUtils, socketUtils} from '../utils.js';
async function versionCheck(workflow) {
    if (!workflow.item) return;
    let isUpToDate = itemUtils.isUpToDate(workflow.item);
    if (isUpToDate) return;
    let message = '<hr>@UUID[' + workflow.item.uuid + ']{' + workflow.item.name + '} ' + genericUtils.translate('CHRISPREMADES.error.outOfDateItem') + '<p><button class="chris-update-item">' + genericUtils.translate('CHRISPREMADES.error.updateItem') + '</button></p>';
    await ChatMessage.create({
        speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
        content: message,
        whisper: [socketUtils.gmID()],
        flags: {
            'chris-premades': {
                button: {
                    type: 'updateItem',
                    data: {
                        itemUuid: workflow.item.uuid
                    }
                }
            }
        }
    });
    genericUtils.notify('CHRISPREMADES.error.outOfDateItem', 'warn');
    return true;
}
export let requirements = {
    versionCheck
};