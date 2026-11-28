import {activityUtils, genericUtils, Logging} from '../../../../../proxy.mjs';
async function editBond({document: activity, data, macroClass: {identifier, source}}) {
    const key = `flags.${source}.emboldeningBondRange`;
    const change = data.effectData.system.changes.find(c => c.key === key);
    if (!change) return Logging.addMacroWarning(source, identifier, `Expansive Bond could not find the range key on its active effect. (activity) ${activity.uuid} (key) ${key}`);
    change.value = activityUtils.getRange(activity);
    genericUtils.setProperty(data.effectData, 'flags.chris-premades.expansiveBond', true);
}
export const expansiveBond = {
    name: 'Expansive Bond',
    version: '2.1.11',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateEmboldeningBondEffect',
            macro: editBond,
            priority: 200
        }
    ]
};
