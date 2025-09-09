import {genericUtils} from '../utils.js';
async function monsterGenerics(actor) {
    //Proof of concept.
    for (let item of actor.items) {
        let updates = {};
        let currentMidiActorFlags = item.flags['chris-premades']?.macros?.midi?.actor ?? [];
        switch(item.name) {
            case 'Pack Tactics':
                genericUtils.setProperty(updates, 'flags.chris-premades.config.generic.packTactics.applied', true);
                genericUtils.setProperty(updates, 'flags.chris-premades.macros.midi.actor', [...currentMidiActorFlags, 'packTactics']);
                break;
            case 'Sunlight Sensitivity':
                genericUtils.setProperty(updates, 'flags.chris-premades.config.generic.sunlightSensitivity', {
                    applied: true,
                    auto: false
                });
                genericUtils.setProperty(updates, 'flags.chris-premades.macros.midi.actor', [...currentMidiActorFlags, 'sunlightSensitivity']);
                break;
        }
        if (Object.keys(updates).length) await genericUtils.update(item, updates);
    }
}
export let monster = {
    monsterGenerics
};