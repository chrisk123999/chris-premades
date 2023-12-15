import {chris} from '../../helperFunctions.js';
import {tashaSummon} from '../../utility/tashaSummon.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    await spawn(workflow.item, {}, chris.getConfiguration(workflow.item, 'prefill'), workflow.token);
}
async function spawn(item, updates, prefill, casterToken) {
    if (!game.modules.get('quick-insert')?.active) {
        ui.notifications.warn('This macro requires the Quick Insert module to be active!');
        return;
    }
    let selectedActor;
    QuickInsert.open({
        spawnCSS: {
            'left': 600,
            'top': 100
        },
        startText: prefill,
        allowMultiple: false,
        restrictTypes: ['Actor'],
        onSubmit: async (selected) => {
            if (!selected) return;
            if (selected.uuid === item.actor.uuid) {
                ui.notifications.warn('You cannot summon yourself!');
                return;
            }
            selectedActor = await fromUuid(selected.uuid);
            if (selectedActor.compendium) {
                ui.notifications.warn('The actor must not be in a compendium!');
                return;
            }
            let durationSeconds = chris.itemDuration(item).seconds;
            let animation = chris.getConfiguration(item, 'animation') ?? (chris.jb2aCheck() === 'patreon' && chris.aseCheck()) ? 'default' : 'none';
            await tashaSummon.spawn(selectedActor, updates, durationSeconds, item, item.system.range.value ?? 120, casterToken, animation);
        }
    });
}
export let summon = {
    'item': item,
    'spawn': spawn
}