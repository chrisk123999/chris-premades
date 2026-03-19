import {actorUtils, effectUtils, genericUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item, actor}}) {
    let existing = actorUtils.getEffects(actor).find(e => e.origin === item.uuid) ?? effectUtils.getEffectByIdentifier(actor, 'tokensOfTheDeparted');
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.advantage.save.con',
                value: `(token.actor.items.get('${item.id}')?.system.uses.value ?? 0) > 0`,
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.deathSave',
                value: `(token.actor.items.get('${item.id}')?.system.uses.value ?? 0) > 0`,
                mode: 0,
                priority: 20
            }
        ],
        'flags.chris-premades.info.identifier': 'tokensOfTheDeparted'
    };
    if (existing) await genericUtils.update(existing, effectData);
    else await effectUtils.createEffect(actor, effectData, {parentEntity: item, identifier: 'tokensOfTheDeparted'});
}
export let tokensOfTheDeparted = {
    name: 'Tokens of the Departed',
    version: '1.5.15',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ]
};
