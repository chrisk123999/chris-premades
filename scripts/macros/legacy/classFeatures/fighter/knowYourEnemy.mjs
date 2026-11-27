import {dialogUtils} from '../../../../proxy.mjs';
const traits = {
    str: actor => actor.system.abilities.str?.value,
    dex: actor => actor.system.abilities.dex?.value,
    con: actor => actor.system.abilities.con?.value,
    ac: actor => actor.system.attributes.ac?.value,
    hp: actor => actor.system.attributes.hp?.value,
    levels: actor => actor.system.details.level ?? 0,
    fighter: actor => actor.classes?.fighter?.system.levels ?? 0
};
async function discern({workflow}) {
    const target = workflow.targets.first()?.actor;
    if (!target) return;
    const fields = Object.keys(traits).map(key => ({label: _loc('CHRISPREMADES.Macros.Legacy.KnowYourEnemy.' + key.capitalize()), name: key, options: {isChecked: false}}));
    const selection = await dialogUtils.runDialog(game.user.id, workflow.item.name, 'CHRISPREMADES.Macros.Legacy.KnowYourEnemy.Select', [['checkbox', fields, {totalMax: 2, displayAsRows: true}]], 'okCancel');
    if (!selection?.buttons) return;
    const lines = fields.filter(field => selection[field.name]).map(field => {
        const mine = traits[field.name](workflow.actor);
        const theirs = traits[field.name](target);
        const comparison = theirs > mine ? 'Superior' : theirs < mine ? 'Inferior' : 'Equal';
        return '<b>' + field.label + ':</b> ' + _loc('CHRISPREMADES.Macros.Legacy.KnowYourEnemy.' + comparison);
    });
    if (!lines.length) return;
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}),
        whisper: [...new Set(ChatMessage.implementation.getWhisperRecipients('GM').map(user => user.id).concat(game.user.id))],
        content: '<b>' + workflow.item.name + ': ' + target.name + '</b><br>' + lines.join('<br>')
    });
}
export const knowYourEnemy = {
    name: 'Know Your Enemy',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: discern,
            priority: 50
        }
    ]
};
