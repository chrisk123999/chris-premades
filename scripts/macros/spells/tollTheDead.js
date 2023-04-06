import {queue} from '../../queue.js';
export async function tollTheDead({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    let queueSetup = await queue.setup(this.item.uuid, 'tollTheDead', 50);
	if (!queueSetup) return;
    if (targetActor.system.attributes.hp.value === targetActor.system.attributes.hp.max) {
        queue.remove(this.item.uuid);
        return;
    }
    let damageFormula = this.damageRoll._formula.replace('d8', 'd12');
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}