import {actorUtils, genericUtils} from '../../../../../utils.js';

async function early({workflow}) {
    let validTargets = workflow.targets.filter(i => ['beast', 'plant'].includes(actorUtils.typeOrRace(i.actor)));
    genericUtils.updateTargets(validTargets);
}
export let charmAnimalsAndPlants = {
    name: 'Channel Divinity: Charm Animals and Plants',
    version: '1.1.0',
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