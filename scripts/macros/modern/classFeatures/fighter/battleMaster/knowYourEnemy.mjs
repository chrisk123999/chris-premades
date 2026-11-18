async function discern({workflow}) {
    const target = workflow.targets.first()?.actor;
    if (workflow.activity.type !== 'utility' || workflow.activity.id === 'knowYourEnemyRst' || !target) return;
    const lines = ['di', 'dr', 'dv', 'ci'].flatMap(trait => {
        const data = target.system.traits[trait];
        const values = [...(data?.value ?? [])].map(key => dnd5e.documents.Trait.keyLabel(key, {trait}));
        if (data?.custom) values.push(data.custom);
        return values.length ? ['<b>' + dnd5e.documents.Trait.traitLabel(trait) + ':</b> ' + values.join(', ')] : [];
    });
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}),
        whisper: ChatMessage.implementation.getWhisperRecipients('GM').map(user => user.id).concat(game.user.id),
        content: '<b>' + workflow.item.name + ': ' + target.name + '</b><br>' + (lines.length ? lines.join('<br>') : _loc('CHRISPREMADES.Macros.Modern.KnowYourEnemy.None'))
    });
}
export const knowYourEnemy = {
    name: 'Know Your Enemy',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: discern,
            priority: 50
        }
    ]
};
