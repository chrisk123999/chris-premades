import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function protectionFromEvilAndGood(workflow) {
	if (workflow.targets.size != 1) return;
	if (workflow.disadvantage === true) return;
	let targetToken = workflow.targets.first();
	let targetActor = targetToken.actor;
	let targetEffect = chris.findEffect(targetActor, 'Protection from Evil and Good');
	if (!targetEffect) return;
	let actorRace = chris.raceOrType(workflow.actor);
	let races = ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'];
	let queueSetup = await queue.setup(workflow.item.uuid, 'protectionFromEvilAndGood', 49);
	if (!queueSetup) return;
	if (races.includes(actorRace)) workflow.disadvantage = true;
	workflow.attackAdvAttribution['Protection From Evil And Good'] = true;
	queue.remove(workflow.item.uuid);
}