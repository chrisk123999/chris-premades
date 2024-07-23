import {Teleport} from '../../lib/teleport.js';
async function use({trigger, workflow}) {
    //todo animation selection
    if (!workflow.failedSaves.size) return;
    let range = 90 + (30 * (workflow.castData.castLevel - 2));
    for (let i of workflow.failedSaves) {
        await Teleport.target([i], workflow.token, {range: range, animation: 'vortexWarp'});
    }
}
export let vortexWarp = {
    name: 'Vortex Warp',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};