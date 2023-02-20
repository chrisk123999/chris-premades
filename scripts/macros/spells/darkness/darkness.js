import {chris} from '../../../helperFunctions.js';
async function darknessItem(workflow) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'spell.darkness', true);
    if (!game.modules.get('token-attacher')?.active) return;
    let attachToken = await chris.dialog('Attach to self?', [['Yes', true], ['No', false]]) || false;
    if (!attachToken) return;
    let tokenObject = workflow.token;
    await template.update(
        {
            'x': tokenObject.center.x,
            'y': tokenObject.center.y
        }
    );
    await tokenAttacher.attachElementsToToken([template], tokenObject, false);
}
async function darknessHook(workflow) {
    if (workflow.targets.size != 1) return;
	let targetToken = workflow.targets.first().document;
	if (!targetToken) return;
	let sourceToken = workflow.token.document;
	let sourceTemplates = game.modules.get('templatemacro').api.findContainers(sourceToken);
	let sourceInDarkness = false;
	for (let i = 0; sourceTemplates.length > i; i++) {
		let testTemplate = canvas.scene.collections.templates.get(sourceTemplates[i]);
		if (!testTemplate) continue;
		let darkness = testTemplate.flags['chris-premades']?.spell?.darkness;
		if (darkness) {
			sourceInDarkness = true;
			break;
		}
	}
	let targetInDarkness = false;
	let targetTemplates = game.modules.get('templatemacro').api.findContainers(targetToken);
	for (let i = 0; targetTemplates.length > i; i++) {
		let testTemplate = canvas.scene.collections.templates.get(targetTemplates[i]);
		if (!testTemplate) continue;
		let darkness = testTemplate.flags['chris-premades']?.spell?.darkness;
		if (darkness) {
			targetInDarkness = true;
			break;
		}
	}
	if (!sourceInDarkness && !targetInDarkness) return;
	let distance = MidiQOL.getDistance(sourceToken, targetToken, {wallsBlock: false});
	let sourceCanSeeTarget = false;
	let targetCanSeeSource = false;
	let sourceActor = sourceToken.actor;
	let targetActor = targetToken.actor;
	let sourceDS = sourceActor.flags['chris-premades']?.feature?.devilsight;
	let targetDS = targetActor.flags['chris-premades']?.feature?.devilsight;
	let sourceSenses = sourceToken.actor.system.attributes.senses;
	let targetSenses = targetToken.actor.system.attributes.senses;
	if ((sourceDS && distance <= 120) || (sourceSenses.tremorsense >= distance) || (sourceSenses.blindsight >= distance) || (sourceSenses.truesight >= distance)) sourceCanSeeTarget = true;
	if ((targetDS && distance <= 120) || (targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance) || (targetSenses.truesight >= distance)) targetCanSeeSource = true;
	if (sourceCanSeeTarget && targetCanSeeSource) return;
	if (sourceCanSeeTarget && !targetCanSeeSource) {
		workflow.advantage = true;
		workflow.attackAdvAttribution['Darkness: Target Can\'t See Source'] = true;
	}
	if (!sourceCanSeeTarget && targetCanSeeSource) {
		workflow.disadvantage = true;
		workflow.flankingAdvantage = false;
		workflow.attackAdvAttribution['Darkness: Source Can\'t See Target'] = true;
	}
	if (!sourceCanSeeTarget && !targetCanSeeSource) {
		workflow.advantage = true;
		workflow.disadvantage = true;
		workflow.attackAdvAttribution['Darkness: Target And Source Can\'t See Eachother'] = true;
	}
}
export let darkness = {
    'item': darknessItem,
    'hook': darknessHook
}