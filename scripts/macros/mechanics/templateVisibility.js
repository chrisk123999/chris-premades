import {constants, genericUtils, itemUtils, templateUtils, tokenUtils} from '../../utils.js';
async function check(workflow) {
    if (!workflow.item || !workflow.token || !workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let target = workflow.targets.first();
    let source = workflow.token;
    let templates = source.scene.templates.filter(template => {
        if (!template.flags['chris-premades']?.template?.visibility?.obscured) return false;
        let testRay = new Ray(source.center, target.center);
        return templateUtils.rayIntersectsTemplate(template, testRay);
    });
    templates.push(...templateUtils.getTemplatesInToken(source));
    templates.push(...templateUtils.getTemplatesInToken(target));
    templates = Array.from(new Set(templates));
    templates = templates.filter(i => i.flags['chris-premades']?.template?.visibility);
    if (!templates.length) return;
    let sourceSenses = source.actor.system.attributes.senses;
    let targetSenses = target.actor.system.attributes.senses;
    let sourceMD = source.actor.flags['chris-premades']?.senses?.magicalDarkness ?? 0;
    let targetMD = target.actor.flags['chris-premades']?.senses?.magicalDarkness ?? 0;
    let distance = tokenUtils.getDistance(source, target);
    templates.forEach(template => {
        let flagData = template.flags['chris-premades'].template.visibility;
        let sourceCanSeeTarget = ((flagData.magicalDarkness && distance <= sourceMD) || (sourceSenses.tremorsense >= distance) || (sourceSenses.blindsight >= distance) || (sourceSenses.truesight >= distance));
        let targetCanSeeSource = ((flagData.magicalDarkness && distance <= targetMD) || (targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance) || (targetSenses.truesight >= distance));
        let templateName = templateUtils.getName(template);
        if (!targetCanSeeSource) {
            workflow.advantage = true;
            workflow.attackAdvAttribution.add(templateName + ': ' + genericUtils.translate('CHRISPREMADES.Template.TargetCantSeeAttacker'));
        }
        if (!sourceCanSeeTarget) {
            workflow.disadvantage = true;
            workflow.flankingAdvantage = false;
            workflow.attackAdvAttribution.add(templateName + ': ' + genericUtils.translate('CHRISPREMADES.Template.AttackerCantSeeTarget'));
        }
    });
}
export let templateVisibility = {
    check
};