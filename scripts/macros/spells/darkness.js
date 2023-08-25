import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function darknessItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.templateId) return;
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.updaet({
        'flags': {
            'chris-premades': {
                'spell': {
                    'darkness': true
                }
            },
            'limits': {
                'sight': {
                    'basicSight': {
                        'enabled': true,
                        'range': 0
                    },
                    'ghostlyGaze': {
                        'enabled': true,
                        'range': 0
                    },
                    'lightPerception': {
                        'enabled': true,
                        'range': 0
                    }
                },
                'light': {
                    'enabled': true,
                    'range': 0
                }
            },
            'walledtemplates': {
                'wallRestriction': 'move',
                'wallsBlock': 'recurse'
            }
        }
    });
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
    let distance = chris.getDistance(sourceToken, targetToken);
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
    let queueSetup = await queue.setup(workflow.item.uuid, 'darkness', 50);
    if (!queueSetup) return;
    if (sourceCanSeeTarget && !targetCanSeeSource) {
        workflow.advantage = true;
        workflow.attackAdvAttribution.add('Darkness: Target Can\'t See Source');
    }
    if (!sourceCanSeeTarget && targetCanSeeSource) {
        workflow.disadvantage = true;
        workflow.flankingAdvantage = false;
        workflow.attackAdvAttribution.add('Darkness: Source Can\'t See Target');
    }
    if (!sourceCanSeeTarget && !targetCanSeeSource) {
        workflow.advantage = true;
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add('Darkness: Target And Source Can\'t See Eachother');
    }
    queue.remove(workflow.item.uuid);
}
export let darkness = {
    'item': darknessItem,
    'hook': darknessHook
}