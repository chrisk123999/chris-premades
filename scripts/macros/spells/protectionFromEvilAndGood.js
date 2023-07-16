import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function protectionFromEvilAndGood(workflow) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let targetEffect = chris.findEffect(targetActor, 'Protection from Evil and Good');
    if (!targetEffect) return;
    let actorRace = chris.raceOrType(workflow.actor);
    let races = ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'];
    let queueSetup = await queue.setup(workflow.item.uuid, 'protectionFromEvilAndGood', 49);
    if (!queueSetup) return;
    if (races.includes(actorRace)) workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: Protection From Evil And Good');
    queue.remove(workflow.item.uuid);
}