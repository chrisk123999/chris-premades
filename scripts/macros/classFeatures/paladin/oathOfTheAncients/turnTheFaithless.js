import {actorUtils, genericUtils} from '../../../../utils.js';

async function early({workflow}) {
    let validTypes = ['fey', 'fiend'];
    genericUtils.updateTargets(workflow.targets.filter(i => validTypes.includes(actorUtils.typeOrRace(i.actor))));
}
export let turnTheFaithless = {
    name: 'Channel Divinity: Turn the Faithless',
    version: '0.12.24',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};