import {socket, sockets} from '../../../../../lib/sockets.js';
import {dialogUtils, genericUtils, socketUtils, tokenUtils} from '../../../../../utils.js';
async function use({trigger: {entity: item}, workflow}) {
    let cprID = genericUtils.getIdentifier(workflow.item) === 'flashOfGenius';
    let sysID = workflow.item.system.identifier === 'flash-of-genius';
    if (!cprID && !sysID) return;
    let near = tokenUtils.findNearby(workflow.token, 30, 'ally', {includeToken: true});
    if (!near?.length) return;
    let promise = dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), near);
    promise.then(async target => {
        if (!target || !target[0]) return;
        target = target[0];
        await item.displayCard();
        await socket.executeAsUser(sockets.teleport.name, socketUtils.firstOwner(target.actor, true), [target.document.uuid], target.document.uuid, {range: 30});
    });
}
export let ingeniousMovement = {
    name: 'Ingenious Movement',
    version: '1.5.17',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 250
            }
        ]
    }
};
