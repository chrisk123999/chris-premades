import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args}) {
    let templateData = {
        't': 'circle',
        'user': game.user,
        'distance': this.castData.castLevel * 20,
        'direction': 0,
        'fillColor': game.user.color,
        'flags': {
            'dnd5e': {
                'origin': this.item.uuid
            },
            'templatemacro': {},
            'midi-qol': {
                'originUuid': this.item.uuid
            },
            'chris-premades': {
                'spell': {
                    'fogCloud': true
                }
            }
        },
        'angle': 0
    };
    let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {parent: canvas.scene});
    let template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
    let[finalTemplate] = await template.drawPreview();
	new Sequence().effect().file('jb2a.fog_cloud.1.white').scale(this.castData.castLevel).aboveLighting().opacity(0.5).persist(true).attachTo(finalTemplate).play();
    let effectData = {
        'label': this.item.name,
        'icon': this.item.img,
        'origin': this.item.uuid,
        'changes': [
            {
                'key': 'flags.dae.deleteUuid',
                'mode': 5,
                'priority': 20,
                'value': finalTemplate.uuid
            }
        ],
        'duration': {
            'seconds': chris.itemDuration(this.item).seconds
        }
    };
    await chris.createEffect(this.actor, effectData);
}
async function hook(workflow) {
    if (workflow.targets.size != 1) return;
	let targetToken = workflow.targets.first().document;
	if (!targetToken) return;
	let sourceToken = workflow.token.document;
	let sourceTemplates = game.modules.get('templatemacro').api.findContainers(sourceToken);
	let sourceInFogCloud = false;
	for (let i = 0; sourceTemplates.length > i; i++) {
		let testTemplate = canvas.scene.collections.templates.get(sourceTemplates[i]);
		if (!testTemplate) continue;
		let fogCloud = testTemplate.flags['chris-premades']?.spell?.fogCloud;
		if (fogCloud) {
			sourceInFogCloud = true;
			break;
		}
	}
	let targetInFogCloud = false;
	let targetTemplates = game.modules.get('templatemacro').api.findContainers(targetToken);
	for (let i = 0; targetTemplates.length > i; i++) {
		let testTemplate = canvas.scene.collections.templates.get(targetTemplates[i]);
		if (!testTemplate) continue;
		let darkness = testTemplate.flags['chris-premades']?.spell?.fogCloud;
		if (darkness) {
			targetInFogCloud = true;
			break;
		}
	}
	if (!sourceInFogCloud && !targetInFogCloud) return;
	let distance = chris.getDistance(sourceToken, targetToken);
	let sourceCanSeeTarget = false;
	let targetCanSeeSource = false;
	let sourceSenses = sourceToken.actor.system.attributes.senses;
	let targetSenses = targetToken.actor.system.attributes.senses;
	if ((sourceSenses.tremorsense >= distance) || (sourceSenses.blindsight >= distance)) sourceCanSeeTarget = true;
	if ((targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance)) targetCanSeeSource = true;
	if (sourceCanSeeTarget && targetCanSeeSource) return;
	if (sourceCanSeeTarget && !targetCanSeeSource) {
		workflow.advantage = true;
		workflow.attackAdvAttribution['Fog Cloud: Target Can\'t See Source'] = true;
	}
	if (!sourceCanSeeTarget && targetCanSeeSource) {
		workflow.disadvantage = true;
		workflow.flankingAdvantage = false;
		workflow.attackAdvAttribution['Fog Cloud: Source Can\'t See Target'] = true;
	}
	if (!sourceCanSeeTarget && !targetCanSeeSource) {
		workflow.advantage = true;
		workflow.disadvantage = true;
		workflow.attackAdvAttribution['Fog Cloud: Target And Source Can\'t See Eachother'] = true;
	}
}
export let fogCloud = {
    'item': item,
    'hook': hook
}