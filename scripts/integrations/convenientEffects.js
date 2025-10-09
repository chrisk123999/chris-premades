import {genericUtils, itemUtils} from '../utils.js';
async function use(activity) {
    let source = itemUtils.getSource(activity.item);
    if (!['chris-premades', 'gambits-premades', 'midi-item-showcase-community', 'automated-crafted-creations'].includes(source)) return;
    if (activity.midiProperties.autoCEEffects != 'none') await genericUtils.update(activity, {'midiProperties.autoCEEffects': 'none'});
}
export let convenientEffects = {
    use
};