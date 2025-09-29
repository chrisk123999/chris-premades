async function rest({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    let currExhaustion = actor.system.attributes.exhaustion;
    if (!currExhaustion) return;
    await actor.update({'system.attributes.exhaustion': currExhaustion - 1});
}
export let tireless = {
    name: 'Tireless',
    version: '1.3.78',
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ]
};