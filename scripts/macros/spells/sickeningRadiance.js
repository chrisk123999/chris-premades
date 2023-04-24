import { chris } from '../../helperFunctions.js';
const overtimeKey = 'flags.midi-qol.OverTime';
async function sickeningRadianceTouched(tokenids) {
    for (let i = 0; tokenids.length > i; i++) {
        let tokenDoc = canvas.scene.tokens.get(tokenids[i]);
        if (!tokenDoc) continue;
        let tokenInTemplates = game.modules.get('templatemacro').api.findContainers(tokenDoc);
        let effect = chris.findEffect(tokenDoc.actor, 'Sickening Radiance');
        let createEffect = false;
        let deleteEffect = false;
        let inRadiance = false;
        let changedTemplate = false;
        let spellLevel = -100;
        let spelldc = -100;
        let oldSpelldc;
        let oldTemplateId;
        let templateid;
        if (effect) {
            oldSpelldc = effect.flags['chris-premades']?.spell?.sickeningradiance?.spelldc;
            templateid = effect.flags['chris-premades']?.spell?.sickeningradiance?.templateid;
        }
        oldTemplateId = templateid;
        for (let j = 0; tokenInTemplates.length > j; j++) {
            let testTemplate = canvas.scene.collections.templates.get(tokenInTemplates[j]);
            if (!testTemplate) continue;
            let sickeningradiance = testTemplate.flags['chris-premades']?.spell?.sickeningradiance;
            if (!sickeningradiance) continue;
            inRadiance = true;
            let testSpelldc = sickeningradiance.spelldc;
            if (testSpelldc > spelldc) {
                spelldc = testSpelldc;
                templateid = tokenInTemplates[j];
            }
        }
        changedTemplate = oldTemplateId != templateid;

        let damageRoll = '4d10';
        let templateDoc = canvas.scene.collections.templates.get(templateid);
        console.log(templateDoc);
        let origin = templateDoc.flags?.dnd5e?.origin;
        async function effectMacro() {
            let combatTurn = game.combat.round + '-' + game.combat.turn;
            let templateid = effect.flags['chris-premades']?.spell?.sickeningradiance?.templateid;
            token.document.setFlag('chris-premades', `spell.sickeningradiance.${templateid}.turn`, combatTurn);
        }
        console.log(effect);
        if (!effect) {
            let effectData = {
                'label': 'Sickening Radiance',
                'icon': 'icons/magic/air/fog-gas-smoke-swirling-green.webp',
                'changes': [],
                'origin': origin,
                'duration': { 'seconds': 86400 },
                'flags': {
                    'effectmacro': {
                        'onTurnStart': {
                            'script': chris.functionToString(effectMacro)
                        }
                    },
                    'chris-premades': {
                        'spell': {
                            'sickeningradiance': {
                                'spelldc': spelldc,
                                'templateid': templateDoc.id
                            }
                        }
                    }
                }
            };
            console.log(effectData);
            await chris.createEffect(tokenDoc.actor, effectData);
            effect = chris.findEffect(tokenDoc.actor, 'Sickening Radiance');
            console.log(effect);
        } else if (changedTemplate) {
            await effect.setFlag('chris-premades', 'spell.sickeningradiance', { spelldc, templateid });
        }
        console.log(inRadiance, changedTemplate);
        if (!inRadiance || changedTemplate) {
            let removeOvertime = effect.changes.filter(c => c['key'] != overtimeKey);
            await chris.updateEffect(effect, {
                changes: removeOvertime
            });
        }
        if (inRadiance){
            if (!effect.changes.some(c => c['key'] === overtimeKey)) {
                let addOvertime = [...effect.changes];
                console.log(addOvertime);
                addOvertime.push({
                    'key': overtimeKey,
                        'mode': 5,
                        'value': 'label="Sickening Radiance", turn=start, rollType=save, saveAbility= con, saveDamage= nodamage, saveRemove= false, saveMagic=true, damageType= poison, damageRoll= ' + damageRoll + ', saveDC = ' + spelldc + ', macro',
                        'priority': 20
                });
                console.log(addOvertime);
                await chris.updateEffect(effect, {
                    changes: addOvertime
                });
            }
        }
    }
}
async function sickeningRadianceItem({ speaker, actor, token, character, item, args }) {
    let template = canvas.scene.collections.templates.get(this.templateId);
    if (!template) return;
    let spelldc = chris.getSpellDC(this.item);
    let touchedTokens = await game.modules.get('templatemacro').api.findContained(template);
    await template.setFlag('chris-premades', 'spell.sickeningradiance', { spelldc, touchedTokens });
    await sickeningRadianceTouched(touchedTokens);
}
async function sickeningRadianceDeleted(template) {
    let touchedTokens = template.flags['chris-premades']?.spell?.sickeningradiance?.touchedTokens;
    if (!touchedTokens) return;
    for (let i = 0; touchedTokens.length > i; i++) {
        let tokenDoc = canvas.scene.tokens.get(touchedTokens[i]);
        if (!tokenDoc) continue;
        await tokenDoc.unsetFlag('chris-premades', 'spell.sickeningradiance.' + template.id);
    }
    await sickeningRadianceTouched(touchedTokens);
}
async function sickeningRadianceEntered(template, token) {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    await warpgate.wait(10);
    await sickeningRadianceTouched([token.id]);
    let touchedTokens = template.flags['chris-premades']?.spell?.sickeningradiance?.touchedTokens || [];
    if (!touchedTokens.includes(token.id)) touchedTokens.push(token.id);
    await template.setFlag('chris-premades', 'spell.sickeningradiance', { touchedTokens });
    let doDamage = false;
    if (chris.inCombat()) {
        let combatTurn = game.combat.round + '-' + game.combat.turn;
        let tokenTurn = token.document.getFlag('chris-premades', `spell.sickeningradiance.${template.id}.turn`);
        if (tokenTurn != combatTurn) doDamage = true;
        token.document.setFlag('chris-premades', `spell.sickeningradiance.${template.id}.turn`, combatTurn);
    } else {
        doDamage = true;
    }
    if (doDamage) {
        let effect = chris.findEffect(token.actor, 'Sickening Radiance');
        if (effect) MidiQOL.doOverTimeEffect(token.actor, effect, true);
    }
}
async function sickeningRadianceLeft(token) {
    await sickeningRadianceTouched([token.id]);
}
async function sickeningRadianceFailedSave() {

}
export let sickeningRadiance = {
    'item': sickeningRadianceItem,
    'deleted': sickeningRadianceDeleted,
    'entered': sickeningRadianceEntered,
    'left': sickeningRadianceLeft,
    'failedSave': sickeningRadianceFailedSave
}
