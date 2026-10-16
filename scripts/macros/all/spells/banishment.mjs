import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, queryUtils} from '../../../proxy.mjs';
async function banish({workflow}) {
    if (!workflow.failedSaves.size) return;
    let natives;
    if (documentUtils.getRules(workflow.item) === '2024') {
        const types = automationUtils.getConfigValue(workflow.item, 'creatureTypes') ?? [];
        natives = Array.from(workflow.failedSaves).filter(token => types.includes(actorUtils.typeOrRace(token.actor)));
    } else {
        const selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.Banishment.Native', Array.from(workflow.failedSaves, token => token.document), {type: 'multiple', maxAmount: workflow.failedSaves.size, skipDeadAndUnconscious: false, userId: queryUtils.gmID()});
        natives = (selection?.result ?? []).map(token => token.object);
    }
    const effects = natives.map(token => token.actor && documentUtils.getEffectByIdentifier(token.actor, 'banished', {sourceActor: workflow.actor})).filter(Boolean);
    await Promise.all(effects.map(effect => documentUtils.setFlag(effect, 'cat', 'banish.permanent', true)));
}
export const banishment = {
    name: 'Banishment',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: banish, priority: 50}
    ],
    config: {
        creatureTypes: {
            default: ['aberration', 'celestial', 'elemental', 'fey', 'fiend'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        }
    }
};
