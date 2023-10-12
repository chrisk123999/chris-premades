import {chris} from '../../helperFunctions.js';
let animations = {
    'abj': 'jb2a.magic_signs.circle.02.abjuration.complete.',
    'con': 'jb2a.magic_signs.circle.02.conjuration.complete.',
    'div': 'jb2a.magic_signs.circle.02.divination.complete.',
    'enc': 'jb2a.magic_signs.circle.02.enchantment.complete.',
    'evo': 'jb2a.magic_signs.circle.02.evocation.complete.',
    'ill': 'jb2a.magic_signs.circle.02.illusion.complete.',
    'nec': 'jb2a.magic_signs.circle.02.necromancy.complete.',
    'trs': 'jb2a.magic_signs.circle.02.transmutation.complete.'
}
let defaults = {
    'abj': 'blue',
    'con': 'yellow',
    'div': 'blue',
    'enc': 'pink',
    'evo': 'red',
    'ill': 'purple',
    'nec': 'green',
    'trs': 'yellow'
};
export async function cast(workflow) {
    if (!workflow.token || workflow.item?.type != 'spell') return;
    let school = workflow.item.system.school;
    if (!Object.keys(animations).includes(school)) return;
    let color = chris.jb2aCheck() === 'patreon' ? game.settings.get('chris-premades', school + '_color') : defaults[school];
    let animation = animations[school] + color;
    new Sequence()
        .effect()
        .file(animation)
        .atLocation(workflow.token)
        .belowTokens()
        .scaleToObject(2)
        .playbackRate(2)
        .play();
    await warpgate.wait(2000);
}