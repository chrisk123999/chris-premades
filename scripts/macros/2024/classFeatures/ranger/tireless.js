async function rest({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    let currExhaustion = actor.system.attributes.exhaustion;
    await actor.update({'system.attributes.exhaustion': Math.max(currExhaustion - 1, 0)});
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