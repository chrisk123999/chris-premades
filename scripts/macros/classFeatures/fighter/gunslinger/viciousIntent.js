import {queue} from '../../../../utility/queue.js';
export async function viciousIntent({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item?.system?.baseItem != 'firearmCR') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'viciousIntent', 50);
    if (!queueSetup) return;
    let critical = duplicate(workflow.item.system.critical);
    if ((critical.threshold ?? 20) <= 19) {
        queue.remove(workflow.item.uuid);
        return;
    }
    critical.threshold = 19;
    workflow.item = workflow.item.clone({'system.critical': critical}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}