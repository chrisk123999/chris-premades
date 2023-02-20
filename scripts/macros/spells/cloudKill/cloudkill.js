import {chris} from '../../../helperFunctions.js';
async function cloudKillTouched(tokenids) {
    for (let i = 0; tokenids.length > i; i++) {
        let tokenDoc = canvas.scene.tokens.get(tokenids[i]);
        if (!tokenDoc) continue;
        let tokenInTemplates = game.modules.get('templatemacro').api.findContainers(tokenDoc);
        let effect = chris.findEffect(tokenDoc.actor, 'Cloudkill');
        let createEffect = false;
        let deleteEffect = false;
        let inCloudkill = false;
        let spellLevel = -100;
        let spelldc = -100;
        let oldSpellLevel;
        let oldSpelldc;
        let templateid;
        if (effect) {
            oldSpellLevel = effect.flags['chris-premades']?.spell?.cloudkill?.spellLevel;
            oldSpelldc = effect.flags['chris-premades']?.spell?.cloudkill?.spelldc;
            templateid = effect.flags['chris-premades']?.spell?.cloudkill?.templateid;
        }
        for (let j = 0; tokenInTemplates.length > j; j++) {
            let testTemplate = canvas.scene.collections.templates.get(tokenInTemplates[j]);
            if (!testTemplate) continue;
            let cloudkill = testTemplate.flags['chris-premades']?.spell?.cloudkill;
            if (!cloudkill) continue;
            inCloudkill = true;
            let testSpellLevel = cloudkill.spellLevel;
            let testSpelldc = cloudkill.spelldc;
            if (testSpellLevel > spellLevel) {
                spellLevel = testSpellLevel;
                templateid = tokenInTemplates[j];
            }
            if (testSpelldc > spelldc) {
                spelldc = testSpelldc;
                templateid = tokenInTemplates[j];
            }
        }
        if (!inCloudkill) {
            deleteEffect = true;
        } else {
            if (oldSpellLevel != spellLevel || oldSpelldc != spelldc) {
                createEffect = true;
                deleteEffect = true;
            }
        }
        if (deleteEffect && effect) {
            try {
                await effect.delete();
            } catch {}
        }
        if (createEffect && inCloudkill && (oldSpellLevel != spellLevel || oldSpelldc != spelldc)) {
            let damageRoll = spellLevel + 'd8';
            let templateDoc = canvas.scene.collections.templates.get(templateid);
            let origin = templateDoc.flags?.dnd5e?.origin;
            async function effectMacro () {
                let combatTurn = game.combat.round + '-' + game.combat.turn;
                let templateid = effect.flags['chris-premades']?.spell?.cloudkill?.templateid;
                token.document.setFlag('chris-premades', `spell.cloudkill.${templateid}.turn`, combatTurn);
            }
            let effectData = {
                'label': 'Cloudkill',
                'icon': 'icons/magic/air/fog-gas-smoke-swirling-green.webp',
                'changes': [
                    {
                    'key': 'flags.midi-qol.OverTime',
                    'mode': 5,
                    'value': 'turn=start, rollType=save, saveAbility= con, saveDamage= halfdamage, saveRemove= false, saveMagic=true, damageType= poison, damageRoll= ' + damageRoll + ', saveDC = ' + spelldc,
                    'priority': 20
                    }
                ],
                'origin': origin,
                'duration': {'seconds': 86400},
                'flags': {
                    'effectmacro': {
                        'onTurnStart': {
                            'script': chris.functionToString(effectMacro)
                        }
                    },
                    'chris-premades': {
                        'spell': {
                            'cloudkill': {
                                'spellLevel': spellLevel,
                                'spelldc': spelldc,
                                'templateid': templateDoc.id
                            }
                        }
                    }
                }
            };
            await chris.createEffect(tokenDoc.actor, effectData);
        }
    }
}
async function cloudkillItem(workflow) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    let spellLevel = workflow.castData.castLevel;
    let spelldc = chris.getSpellDC(workflow.item);
    let touchedTokens = await game.modules.get('templatemacro').api.findContained(template);
    await template.setFlag('chris-premades', 'spell.cloudkill', {spellLevel, spelldc, touchedTokens});
    await cloudKillTouched(touchedTokens);
    async function effectMacro () {
        function getAllowedMoveLocation(casterToken, templateDoc, maxSquares) {
            for (let i = maxSquares; i > 0; i--) {
                let movePixels = i * canvas.grid.size;
                let ray = new Ray(casterToken.center, templateDoc.object.center);
                let newCenter = ray.project((ray.distance + movePixels)/ray.distance);
                let isAllowedLocation = canvas.effects.visibility.testVisibility({x: newCenter.x, y: newCenter.y}, {object: templateDoc.Object});
                if(isAllowedLocation) {
                    return newCenter;
                }
            }
            return null;
        }
        let templateId = effect.flags['chris-premades']?.spell?.cloudkill?.templateId;
        if (!templateId) return;
        let templateDoc = canvas.scene.collections.templates.get(templateId);
        if (!templateDoc) return;
        let newCenter = getAllowedMoveLocation(token, templateDoc, 2);
        if(!newCenter) {
            ui.notifications.info('No room to move cloudkill.');
            return;
        }
        newCenter = canvas.grid.getSnappedPosition(newCenter.x, newCenter.y, 1);
        await templateDoc.update({x: newCenter.x, y: newCenter.y});
    }
    let effectData = {
        'label': 'Cloudkill - Movement Handler',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60 * workflow.item.system.duration.value
        },
        'flags': {
            'effectmacro': {
                'onTurnStart': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'cloudkill': {
                        'templateId': workflow.templateId
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
async function cloudkillDeleted(template) {
    let touchedTokens = template.flags['chris-premades']?.spell?.cloudkill?.touchedTokens;
    if (!touchedTokens) return;
    for (let i = 0; touchedTokens.length > i; i++) {
        let tokenDoc = canvas.scene.tokens.get(touchedTokens[i]);
        if (!tokenDoc) continue;
        await tokenDoc.unsetFlag('chris-premades', 'spell.cloudkill.' + template.id);
    }
    await cloudKillTouched(touchedTokens);
}
async function cloudkillEntered(template, token) {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    await warpgate.wait(10);
    await cloudKillTouched([token.id]);
    let touchedTokens = template.flags['chris-premades']?.spell?.cloudkill?.touchedTokens || [];
    if (!touchedTokens.includes(token.id)) touchedTokens.push(token.id);
    await template.setFlag('chris-premades', 'spell.cloudkill', {touchedTokens});
    let doDamage = false;
    if (game.combat != null && game.combat != undefined) {
        let combatTurn = game.combat.round + '-' + game.combat.turn;
        let tokenTurn = token.document.getFlag('chris-premades', `spell.cloudkill.${template.id}.turn`);
        if (tokenTurn != combatTurn) doDamage = true;
        token.document.setFlag('chris-premades', `spell.cloudkill.${template.id}.turn`, combatTurn);
    } else {
        doDamage = true;
    }
    if (doDamage) {
        let effect = chris.findEffect(token.actor, 'Cloudkill');
        if (effect) MidiQOL.doOverTimeEffect(token.actor, effect, true);
    }
}
async function cloudkillLeft(token) {
    await cloudKillTouched([token.id]);
}
async function cloudkillMoved(template) {
    let tokensInTemplate = await game.modules.get('templatemacro').api.findContained(template);
    let touchedTokens = template.flags['chris-premades']?.spell?.cloudkill?.touchedTokens || [];
    for (let i = 0; tokensInTemplate.length > i; i++) {
        if (!touchedTokens.includes(tokensInTemplate[i])) touchedTokens.push(tokensInTemplate[i]);
    }
    await template.setFlag('chris-premades', 'spell.cloudkill', {touchedTokens});
    await cloudKillTouched(touchedTokens);
}
export let cloudkill = {
    'item': cloudkillItem,
    'deleted': cloudkillDeleted,
    'entered': cloudkillEntered,
    'left': cloudkillLeft,
    'moved': cloudkillMoved
}