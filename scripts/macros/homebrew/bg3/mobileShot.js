import {chris} from '../../../helperFunctions.js';
export async function mobileShot({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let validTypes = [
        'handcrossbow'
    ];
    let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && validTypes.includes(i.system.type?.baseItem) && i.system.equipped);
    if (!validWeapons.length) {
        ui.notifications.info('No valid equipped weapons!');
        return;
    }
    let weapon;
    if (validWeapons.length === 1) weapon = validWeapons[0];
    if (!weapon) [weapon] = await chris.selectDocument('What weapon?', validWeapons);
    if (!weapon) return;
    await weapon.use();
}