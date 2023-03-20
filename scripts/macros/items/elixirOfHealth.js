import {chris} from '../../helperFunctions.js';
export async function elixirOfHealth({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetActor = this.targets.first().actor;
    await chris.removeCondition(targetActor, 'Blinded');
    await chris.removeCondition(targetActor, 'Deafened');
    await chris.removeCondition(targetActor, 'Paralyzed');
    await chris.removeCondition(targetActor, 'Poisoned');
}