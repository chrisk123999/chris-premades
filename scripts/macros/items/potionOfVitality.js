import {chris} from '../../helperFunctions.js';
export async function potionOfVitality({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetActor = this.targets.first().actor;
    await chris.removeCondition(targetActor, 'Poisoned');
    await chris.removeCondition(targetActor, 'Exhaustion 1');
    await chris.removeCondition(targetActor, 'Exhaustion 2');
    await chris.removeCondition(targetActor, 'Exhaustion 3');
    await chris.removeCondition(targetActor, 'Exhaustion 4');
    await chris.removeCondition(targetActor, 'Exhaustion 5');
}