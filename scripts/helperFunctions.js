import {summonEffects} from './macros/animations/summonEffects.js';
import {socket} from './module.js';
export let chris = {
    'dialog': async function _dialog(title, options, content) {
        if (content) content = '<center>' + content + '</center>';
        let buttons = options.map(([label, value]) => ({label, value}));
        let selected = await warpgate.buttonDialog(
            {
                buttons,
                title,
                content
            },
            'column'
        );
        return selected;
    },
    'numberDialog': async function _numberDialog(title, buttons, options) {
        let inputs = [];
        for (let i of options) {
            inputs.push({
                'label': i,
                'type': 'number'
            });
        }
        let config = {
            'title': title
        };
        return await warpgate.menu(
            {
                'inputs': inputs,
                'buttons': buttons
            },
            config
        );
    },
    'findEffect': function _findEffect(actor, name) {
        return chris.getEffects(actor).find(i => i.name === name);
    },
    'createEffect': async function _createEffect(actor, effectData) {
        if (effectData.label) {
            console.warn('The effect "' + effectData.label + '" has effect data with a label instead of a name!');
            effectData.name = effectData.label;
            delete effectData.label;
        }
        if (chris.firstOwner(actor).id === game.user.id) {
            let effects = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
            return effects[0];
        } else {
            return await fromUuid(await socket.executeAsGM('createEffect', actor.uuid, effectData));
        }
    },
    'removeEffect': async function _removeEffect(effect) {
        if (chris.firstOwner(effect).id === game.user.id) {
            await effect.delete();
        } else {
            await socket.executeAsGM('removeEffect', effect.uuid);
        }
    },
    'updateEffect': async function _updateEffect(effect, updates) {
        if (game.user.isGM) {
            await effect.update(updates);
        } else {
            updates._id = effect.id;
            await socket.executeAsGM('updateEffect', effect.uuid, updates);
        }
    },
    'addCondition': async function _addCondition(actor, name, overlay, origin) {
        await game.dfreds.effectInterface.addEffect(
            {
                'effectName': name,
                'uuid': actor.uuid,
                'origin': origin,
                'overlay': overlay
            }
        );
    },
    'removeCondition': async function _removeCondition(actor, name) {
        await game.dfreds.effectInterface.removeEffect(
            {
                'effectName': name,
                'uuid': actor.uuid
            }
        );
    },
    'applyDamage': async function _applyDamage(tokenList, damageValue, damageType) {
        let targets;
        if (Array.isArray(tokenList)) {
            targets = new Set(tokenList);
        } else {
            targets = new Set([tokenList]);
        }
        await MidiQOL.applyTokenDamage(
            [
                {
                    damage: damageValue,
                    type: damageType
                }
            ],
            damageValue,
            targets,
            null,
            null
        );
    },
    'applyWorkflowDamage': async function _applyWorkflowDamage(sourceToken, damageRoll, damageType, targets, flavor, itemCardId) {
        new MidiQOL.DamageOnlyWorkflow(sourceToken.actor, sourceToken, damageRoll.total, damageType, targets, damageRoll, {'flavor': flavor, 'itemCardId': itemCardId});
    },
    'findNearby': function _findNearby(tokenDoc, range, disposition, includeIncapacitated = false, includeToken = false) {
        let dispositionValue;
        switch (disposition) {
            case 'ally':
                dispositionValue = 1;
                break;
            case 'neutral':
                dispositionValue = 0;
                break;
            case 'enemy':
                dispositionValue = -1;
                break;
            default:
                dispositionValue = null;
        }
        let options = {'includeIncapacitated': includeIncapacitated, 'includeToken': includeToken};
        return MidiQOL.findNearby(dispositionValue, tokenDoc, range, options).filter(i => !i.document.hidden);
    },
    'addToRoll': async function _addToRoll(roll, addonFormula) {
        let addonFormulaRoll = await new Roll('0 + ' + addonFormula).evaluate({async: true});
        game.dice3d?.showForRoll(addonFormulaRoll);
        for (let i = 1; i < addonFormulaRoll.terms.length; i++) {
            roll.terms.push(addonFormulaRoll.terms[i]);
        }
        roll._total += addonFormulaRoll.total;
        roll._formula = roll._formula + ' + ' + addonFormula;
        return roll;
    },
    'getSpellDC': function _getSpellDC(item) {
        let spellDC;
        let scaling = item.system.save.scaling;
        if (scaling === 'spell') {
            spellDC = item.actor.system.attributes.spelldc;
        } else  if (scaling != 'flat') {
            spellDC = item.actor.system.abilities[scaling].dc;
        } else {
            spellDC = item.system.save.dc;
            if (!spellDC) spellDC = 10;
        }
        return spellDC;
    },
    'getSpellMod': function _getSpellMod(item) {
        let spellMod;
        let scaling = item.system.save.scaling;
        if (scaling === 'spell') {
            spellMod = item.actor.system.abilities[item.actor.system.attributes.spellcasting].mod;
        } else {
            spellMod = item.actor.system.abilities[scaling].mod;
        }
        return spellMod;
    },
    'selectTarget': async function _selectTarget(title, buttons, targets, returnUuid, type, selectOptions, fixTargets, description, coverToken, reverseCover) {
        let generatedInputs = [];
        let isFirst = true;
        let number = 1;
        for (let i of targets) {
            let name;
            if (game.settings.get('chris-premades', 'Show Names')) {
                name = i.document.name;
            } else {
                if (i.document.disposition <= 0) {
                    name = 'Unknown Target (' + number + ')';
                    number++;
                } else {
                    name = i.document.name;
                }
            }
            if (coverToken && !reverseCover) {
                name += ' [' + chris.checkCover(coverToken, i, undefined, true) + ']';
            } else if (coverToken) {
                name += ' [' + chris.checkCover(i, coverToken, undefined, true) + ']';
            }
            let texture = i.document.texture.src;
            let html = `<img src="` + texture + `" id="` + i.id + `" style="width:40px;height:40px;vertical-align:middle;"><span> ` + name + `</span>`;
            let value = i.id;
            if (returnUuid) value = i.document.uuid;
            if (type === 'multiple') {
                generatedInputs.push({
                    'label': html,
                    'type': 'checkbox',
                    'options': false,
                    'value': value
                });
            } else if (type === 'one') {
                generatedInputs.push({
                    'label': html,
                    'type': 'radio',
                    'options': ['group1', isFirst],
                    'value': value
                });
                isFirst = false;
            } else if (type === 'number') {
                generatedInputs.push({
                    'label': html,
                    'type': 'number'
                });
            } else if (type === 'select') {
                generatedInputs.push({
                    'label': html,
                    'type': 'select',
                    'options': selectOptions,
                    'value': value
                });
            } else return {'buttons': false};
        }
        if (fixTargets) {
            generatedInputs.push({
                'label': 'Skip Dead & Unconscious?',
                'type': 'checkbox',
                'options': true,
                'value': true
            });
        }
        if (description) generatedInputs.unshift({
            'label': description,
            'type': 'info'
        });
        function dialogRender(html) {
            let trs = html[0].getElementsByTagName('tr');
            if (type != 'select') {
                for (let t of trs) {
                    t.style.display = 'flex';
                    t.style.flexFlow = 'row-reverse';
                    t.style.alignItems = 'center';
                    t.style.justifyContent = 'flex-end';
                    if (type === 'one') t.addEventListener('click', function () {t.getElementsByTagName('input')[0].checked = true});
                }
            }
            let ths = html[0].getElementsByTagName('th');
            for (let t of ths) {
                t.style.width = 'auto';
                t.style.textAlign = 'left';
            }
            let tds = html[0].getElementsByTagName('td');
            for (let t of tds) {
                t.style.textAlign = 'center';
                t.style.paddingRight = '5px';
                if (t.attributes?.colspan?.value == 2) continue;
                t.style.width = '50px';
            }
            let imgs = html[0].getElementsByTagName('img');
            for (let i of imgs) {
                i.style.border = 'none';
                i.addEventListener('click', async function () {
                    await canvas.ping(canvas.tokens.get(i.getAttribute('id')).document.object.center);
                });
                i.addEventListener('mouseover', function () {
                    let targetToken = canvas.tokens.get(i.getAttribute('id'));
                    targetToken.hover = true;
                    targetToken.refresh();
                });
                i.addEventListener('mouseout', function () {
                    let targetToken = canvas.tokens.get(i.getAttribute('id'));
                    targetToken.hover = false;
                    targetToken.refresh();
                });
            }
        }
        let config = {
            'title': title,
            'render': dialogRender
        };
        let selection = await warpgate.menu({'inputs': generatedInputs, 'buttons': buttons}, config);
        if (!selection.buttons) return {'buttons': false};
        if (description) selection.inputs?.shift();
        if (type != 'number' && type != 'select') {
            for (let i = 0; i < (!fixTargets ? selection.inputs.length : selection.inputs.length - 1); i++) {
                if (selection.inputs[i]) selection.inputs[i] =  generatedInputs[description ? i + 1 : i].value;
            }
        }
        return selection;
    },
    'checkTrait': function _checkTrait(actor, type, trait) {
        return actor.system.traits[type].value.has(trait);
    },
    'functionToString': function _functiongToString(input) {
        return `(${input.toString()})()`;
    },
    'getItemFromCompendium': async function _getItemFromCompendium(key, name, ignoreNotFound, packFolderId) {
        const gamePack = game.packs.get(key);
        if (!gamePack) {
            ui.notifications.warn('Invalid compendium specified!');
            return false;
        }
        let packIndex = await gamePack.getIndex({'fields': ['name', 'type', 'folder']});
        let match = packIndex.find(item => item.name === name && (!packFolderId || (packFolderId && item.folder === packFolderId)));
        if (match) {
            return (await gamePack.getDocument(match._id))?.toObject();
        } else {
            if (!ignoreNotFound) ui.notifications.warn('Item not found in specified compendium! Check spelling?');
            return undefined;
        }
    },
    'raceOrType': function _raceOrType(entity) {
        return MidiQOL.typeOrRace(entity);
    },
    'getItemDescription': function _getItemDescription(key, name) {
        let journalEntry = game.journal.getName(key);
        if (!journalEntry) {
            ui.notifications.error('Item descriptions journal entry not found!');
            return;
        }
        let page = journalEntry.pages.getName(name);
        if (!page) {
            ui.notifications.warn('Item description not found in journal!');
            return;
        }
        let description = page.text.content;
        return description;
    },
    'getDistance': function _getDistance(sourceToken, targetToken, wallsBlock) {
        return MidiQOL.computeDistance(sourceToken, targetToken, wallsBlock);
    },
    'totalDamageType': function _totalDamageType(actor, damageDetail, type) {
        let total = 0;
        let immune = chris.checkTrait(actor, 'di', type);
        if (immune) return 0;
        for (let i of damageDetail) {
            if (i.type.toLowerCase() === type.toLowerCase()) total += i.damage;
        }
        let resistant = chris.checkTrait(actor, 'dr', type);
        if (resistant) total = Math.floor(total / 2);
        return total;
    },
    'getEffectCastLevel': function _getEffectCastLevel(effect) {
        return effect.flags['midi-qol']?.castData?.castLevel;
    },
    'getRollDamageTypes': function _getRollDamageTypes(damageRoll) {
        let types = new Set();
        for (let i of damageRoll.terms) {
            if (i.flavor != '') types.add(i.flavor.toLowerCase());
        }
        return types;
    },
    'getRollsDamageTypes': function _getRollsDamageTypes(damageRolls) {
        return new Set(damageRolls.map(i => i.options.type));
    },
    'perTurnCheck': function _perTurnCheck(originItem, type, name, ownTurnOnly, tokenId) {
        if (!chris.inCombat()) return true;
        if (ownTurnOnly && (tokenId != game.combat.current.tokenId)) return false;
        let currentTurn = game.combat.round + '-' + game.combat.turn;
        let previousTurn = originItem.flags['chris-premades']?.[type]?.[name]?.turn;
        if (currentTurn != previousTurn) return true;
        return false;
    },
    'setTurnCheck': async function _setTurnCheck(originItem, type, name, reset) {
        let turn = '';
        if (chris.inCombat() && !reset) turn = game.combat.round + '-' + game.combat.turn;
        await originItem.setFlag('chris-premades', type + '.' + name + '.turn', turn);
    },
    'tokenInTemplate': function _tokenInTemplate(token, template) {
        let containedTokens = game.modules.get('templatemacro').api.findContained(template);
        let foundToken = containedTokens.find(i => i === token.id);
        return foundToken;
    },
    'tokenTemplates': function _tokenTemplates(token) {
        return game.modules.get('templatemacro').api.findContainers(token);
    },
    'templateTokens': function _templateTokens(template) {
        return game.modules.get('templatemacro').api.findContained(template);
    },
    'findGrids': function _findGrids(previousCoords, coords, templateDoc) {
        return game.modules.get('templatemacro').api.findGrids(previousCoords, coords, templateDoc);
    },
    'inCombat': function _inCombat() {
        return !(game.combat === null || game.combat === undefined || game.combat?.started === false);
    },
    'addTempItem': async function _addTempItem(actor, itemData, itemID, category, favorite, itemNumber) {
        if (!itemData.flags['chris-premades']) itemData.flags['chris-premades'] = {}
        itemData.flags['chris-premades'].tempItem = {
            'source': itemID,
            'itemNumber': itemNumber
        }
        if (category) itemData.flags['custom-character-sheet-sections'] = {
            'sectionName': category
        };
        if (favorite) itemData.flags['tidy5e-sheet'] = {
            'favorite': true
        };
        await actor.createEmbeddedDocuments('Item', [itemData]);
    },
    'removeTempItems': async function _removeTempItems(actor, itemID) {
        let items = actor.items.filter(item => item.flags['chris-premades']?.tempItem?.source === itemID);
        for (let i of items) {
            await i.delete();
        }
    },
    'getTempItem': function _getTempItem(actor, itemID, itemNumber) {
        return actor.items.find(item => item.flags['chris-premades']?.tempItem?.source === itemID && item.flags['chris-premades']?.tempItem?.itemNumber === itemNumber);
    },
    'getCompendiumItemDescription': async function _getCompendiumItemDescription(name) {
        let itemData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Item Compendium'), name, false);
        if (itemData) return itemData.system.description.value;
    },
    'updateTargets': function _updateTargets(targets) {
        game.user.updateTokenTargets(targets);
    },
    'increaseExhaustion': async function _increaseExhaustion(actor, originUuid) {

        let effect = chris.getEffects(actor).find(eff => eff.name.includes('Exhaustion'));
        if (!effect) {
            await chris.addCondition(actor, 'Exhaustion 1', false, originUuid);
            return;
        }
        let level = Number(effect.name.substring(11));
        if (isNaN(level)) return;
        if (level >= 5) {
            await chris.addCondition(actor, 'Dead', true, originUuid);
            return;
        }
        let conditionName = effect.name.substring(0, 11) + (level + 1);
        await chris.removeEffect(effect);
        await chris.addCondition(actor, conditionName, false, originUuid);
    },
    'itemDuration': function _itemDuration(item) {
        return DAE.convertDuration(item.system.duration, chris.inCombat());
    },
    'getCriticalFormula': function _getCriticalFormula(formula) {
        return new CONFIG.Dice.DamageRoll(formula, {}, {'critical': true, 'powerfulCritical': game.settings.get('dnd5e', 'criticalDamageMaxDice'), 'multiplyNumeric': game.settings.get('dnd5e', 'criticalDamageModifiers')}).formula;
    },
    'getSize': function _getSize(actor, sizeToString) {
        let sizeValue;
        let sizeString;
        switch (actor.system.traits.size) {
            case 'tiny':
                sizeValue = 0;
                sizeString = 'tiny';
                break;
            case 'sm':
                sizeValue = 1;
                sizeString = 'small';
                break;
            case 'med':
                sizeValue = 2;
                sizeString = 'medium';
                break;
            case 'lg':
                sizeValue = 3;
                sizeString = 'large';
                break;
            case 'huge':
                sizeValue = 4;
                sizeString = 'huge';
                break;
            case 'grg':
                sizeValue = 5;
                sizeString = 'gargantuan'
                break;
        }
        if (sizeToString) {
            return sizeString;
        } else {
            return sizeValue;
        }
    },
    'sizeStringValue': function _sizeStringValue(sizeString){
        let sizeValue;
        switch (sizeString.toLowerCase()) {
            case 'tiny':
                sizeValue = 0;
                break;
            case 'small':
                sizeValue = 1;
                break;
            case 'medium':
                sizeValue = 2;
                break;
            case 'large':
                sizeValue = 3;
                break;
            case 'huge':
                sizeValue = 4;
                break;
            case 'gargantuan':
                sizeValue = 5;
                break;
            case 'sm':
                sizeValue = 1;
                break;
            case 'med':
                sizeValue = 2;
                break;
            case 'lg':
                sizeValue = 3;
                break;
            case 'grg':
                sizeValue = 5;
                break;
        }
        return sizeValue;
    },
    'aimCrosshair': async function _aimCrosshair(token, maxRange, icon, interval, size) {
        let distance = 0;
        let ray;
        let checkDistance = async (crosshairs) => {
            while (crosshairs.inFlight) {
                await warpgate.wait(100);
                ray = new Ray(token.center, crosshairs);
                distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                if (token.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > maxRange) {
                    crosshairs.icon = 'icons/svg/hazard.svg';
                } else {
                    crosshairs.icon = icon;
                }
                crosshairs.draw();
                crosshairs.label = distance + '/' + maxRange + 'ft.';
            }
        }
        let callbacks = {
            'show': checkDistance
        }
        let options = {
            'size': size,
            'icon': icon,
            'label': '0 ft.',
            'interval': interval
        }
        if (!maxRange) return await warpgate.crosshairs.show(options);
        return await warpgate.crosshairs.show(options, callbacks);
    },
    'getConfiguration': function _getConfiguration(item, key) {
        let keyName = key.toLowerCase().split(' ').join('-').toLowerCase();
        let keyItem = item.flags['chris-premades']?.configuration?.[keyName];
        if (keyItem != undefined) return keyItem === '' ? undefined : keyItem;
        let itemName = item.flags['chris-premades']?.info?.name ?? item.name;
        let keyDefault = CONFIG.chrisPremades.itemConfiguration?.[itemName]?.text?.[keyName]?.default ?? CONFIG.chrisPremades.itemConfiguration?.[itemName]?.select?.[keyName]?.default ?? CONFIG.chrisPremades.itemConfiguration?.[itemName]?.checkbox?.[keyName]?.default ?? CONFIG.chrisPremades.itemConfiguration?.[itemName]?.number?.[keyName]?.default;
        return keyDefault === '' ? undefined : keyDefault;
    },
    'setConfiguration': async function _setConfiguration(item, key, value) {
        return await item.setFlag('chris-premades', 'configuration.' + key.toLowerCase().split(' ').join('-').toLowerCase(), value);
    },
    'updateCombatant': async function _updateCombatant(combatant, updates) {
        if (game.user.isGM) {
            await combatant.update(updates);
        } else {
            await socket.executeAsGM('updateCombatant', combatant.uuid, updates);
        }
    },
    'getCombatant': function _getCombatant(token) {
        return game.combat?.combatants?.find(i => i.tokenId === token.id);
    },
    'remoteDialog': async function _remoteDialog(title, options, userId, content) {
        if (userId === game.user.id) return await chris.dialog(title, options, content);
        return await socket.executeAsUser('remoteDialog', userId, title, options, content)
    },
    'firstOwner': function _firstOwner(document) {
        return warpgate.util.firstOwner(document);
    },
    'jb2aCheck': function _jb2aCheck() {
        let patreon = game.modules.get('jb2a_patreon')?.active;
        let free = game.modules.get('JB2A_DnD5e')?.active;
        if (patreon && free) {
            ui.notifications.info('Both JB2A Modules are Active Please Disable the Free Version.');
            return 'patreon';
        }
        if (patreon) return 'patreon';
        if (free) return 'free';
        ui.notifications.info('No JB2A Module Active');
        return false;
    },
    'aseCheck': function _aseCheck() {
        let cartoon = game.modules.get('animated-spell-effects-cartoon')?.active;
        return cartoon;
    },
    'selectDocument': async function selectDocument(title, documents, useUuids, displayTooltips = false) {
        return await new Promise(async (resolve) => {
            let buttons = {},
                dialog;
            for (let i of documents) {
                buttons[i.name] = {
                    label: `<img src='${i.img}' width='50' height='50' style='border: 0px; float: left'><p style='padding: 1%; font-size: 15px'` + (displayTooltips ? ` data-tooltip="${i.system.description.value.replace(/<[^>]*>?/gm, '')}"` : ``) + `> ${i.name} </p>`,
                    callback: () => {
                        if (useUuids) {
                            resolve([i.uuid]);
                        } else {
                            resolve([i])
                        }
                    }
                }
            }
            let height = (Object.keys(buttons).length * 56 + 46);
            if (Object.keys(buttons).length > 14 ) height = 850;
            dialog = new Dialog(
                {
                    title: title,
                    buttons,
                    close: () => resolve(false)
                },
                {
                    height: height
                }
            );
            await dialog._render(true);
            dialog.element.find(".dialog-buttons").css({
                "flex-direction": 'column',
            })
        });
    },
    'selectDocuments': async function selectDocuments(title, documents, useUuids, displayTooltips = false) {
        return await new Promise(async (resolve) => {
            let buttons = {cancel: {'label': `Cancel`, callback: () => resolve(false)}, 'confirm': {'label': `Confirm`, callback: (html) => getDocuments(html, documents)}},
                dialog;
            let content = `<form>`;
            content += `<datalist id = 'defaultNumbers'>`;
            for (let i = 0; i < 33; i++) {
                content += `<option value = '${i}'></option>`
            }
            content += `</datalist>`;
            for (let i = 0; documents.length > i; i++) {
                content += 
                    `<div class = 'form-group'>
                        <input type='number' id='${i}' name='${documents[i].name}' placeholder='0' list='defaultNumbers' style='max-width: 50px; margin-left: 10px'/>
                        <label> 
                            <img src='${documents[i].img}' width='50' height='50' style='border:1px solid gray; border-radius: 5px; float: left; margin-left: 20px; margin-right: 10px'>
                            <p style='padding: 1%; text-align: center; font-size: 15px;'` + (displayTooltips ? ` data-tooltip="${i.system.description.value.replace(/<[^>]*>?/gm, '')}"` : ``) + `>` + (documents[i].system?.details?.cr != undefined ? ` (CR ${chris.decimalToFraction(documents[i].system?.details?.cr)})` : ``) + `</p>
                        </label>
                    </div>
                `;
            }
            content += `</form>`;
            let height = (documents.length * 53 + 83);
            if (documents.length > 14 ) height = 850;
            dialog = new Dialog(
                {
                    title: title,
                    content: content,
                    buttons: buttons,
                    close: () => resolve(false)
                },
                {
                    height: height
                }
            );
            await dialog._render(true);
            function getDocuments(html, documents) {
                let returns = [];
                for (let i = 0; documents.length > i; i++) {
                    let current = html[0].querySelector(`input[id='${i}']`)?.value;
                    if (current > 0) {
                        for (let j = 0; current > j; j++) {
                            if (useUuids) {
                                returns.push(documents[i].uuid);
                            } else {
                                returns.push(documents[i]);
                            }
                        }
                    }
                }
                resolve(returns);
            }
        });
    },
    'remoteDocumentDialog': async function _remoteDocumentsDialog(userId, title, documents, displayTooltips = false) {
        if (userId === game.user.id) return await chris.selectDocument(title, documents, false, displayTooltips);
        let uuids = await socket.executeAsUser('remoteDocumentDialog', userId, title, documents.map(i => i.uuid), displayTooltips);
        if (!uuids) return false;
        return await Promise.all(uuids.map(async i => await fromUuid(i)));
    },
    'remoteDocumentsDialog': async function _remoteDocumentsDialog(userId, title, documents, displayTooltips = false) {
        if (userId === game.user.id) return await chris.selectDocuments(title, documents, false, displayTooltips);
        let uuids = await socket.executeAsUser('remoteDocumentsDialog', userId, title, documents.map(i => i.uuid), displayTooltips);
        if (!uuids) return false;
        return await Promise.all(uuids.map(async i => await fromUuid(i)));
    },
    'getItem': function _getItem(actor, name) {
        return actor.items.find(i => i.flags['chris-premades']?.info?.name === name);
    },
    'rollRequest': async function _rollRequest(token, request, ability) {
        let userID = chris.firstOwner(token).id;
        let data = {
            'targetUuid': token.document.uuid,
            'request': request,
            'ability': ability
        };
        return await MidiQOL.socket().executeAsUser('rollAbility', userID, data);
    },
    'remoteAimCrosshair': async function _remoteAimCrosshair(token, maxRange, icon, interval, size, userId) {
        if (userId === game.user.id) return await chris.aimCrosshair(token, maxRange, icon, interval, size);
        return await socket.executeAsUser('remoteAimCrosshair', userId, token.document.uuid, maxRange, icon, interval, size);
    },
    'menu': async function _menu(title, buttons, inputs, useSpecialRender, info, header, extraOptions = {}) {
        function render(html) {
            let ths = html[0].getElementsByTagName('th');
            for (let t of ths) {
                t.style.width = 'auto';
                t.style.textAlign = 'left';
            }
            let tds = html[0].getElementsByTagName('td');
            for (let t of tds) {
                t.style.textAlign = 'center';
                t.style.paddingRight = '5px';
                if (t.attributes?.colspan?.value == 2) continue;
                t.style.width = '50px';
            }
        }
        let newInputs = duplicate(inputs);
        if (header) newInputs.unshift({'label': header, 'type': 'header'});
        if (info) newInputs.unshift({'label': info, 'type': 'info'});
        let options = {'title': title};
        options = mergeObject(options, extraOptions);
        if (useSpecialRender) options.render = render;
        let selection = await warpgate.menu({'inputs': newInputs, 'buttons': buttons}, options);
        if (header) selection?.inputs?.shift();
        if (info) selection?.inputs?.shift();
        return selection;
    },
    'remoteMenu': async function _remoteMenu(title, buttons, inputs, useSpecialRender, userId, info, header, extraOptions) {
        if (userId === game.user.id) return await chris.menu(title, buttons, inputs, useSpecialRender, info, header, extraOptions);
        return await socket.executeAsUser('remoteMenu', userId, title, buttons, inputs, useSpecialRender, info, header, extraOptions);
    },
    'decimalToFraction': function _decimalToFraction(decimal) {
        if (!decimal) return 0;
        if (Number(decimal) >= 1) return Number(decimal);
        return '1/' + 1 / Number(decimal);
    },
    'animationCheck': function _animationCheck(item) {
        if (item.flags?.autoanimations?.isEnabled || item.flags['chris-Premades']?.info?.hasAnimation) return true;
        let state = false;
        let name = item.name;
        let autorecSettings = {
            melee: game.settings.get('autoanimations', 'aaAutorec-melee'),
            range: game.settings.get('autoanimations', 'aaAutorec-range'),
            ontoken: game.settings.get('autoanimations', 'aaAutorec-ontoken'),
            templatefx: game.settings.get('autoanimations', 'aaAutorec-templatefx'),
            aura: game.settings.get('autoanimations', 'aaAutorec-aura'),
            preset: game.settings.get('autoanimations', 'aaAutorec-preset'),
            aefx: game.settings.get('autoanimations', 'aaAutorec-aefx'),
        }
        Object.entries(autorecSettings).forEach(setting => setting[1].forEach(autoRec => name.toLowerCase().includes(autoRec.label.toLowerCase()) ? state = true : ''));
        return state;
    },
    'createTemplate': async function _createTemplate(templateData, returnTokens) {
        let [template] = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [templateData]);
        if (!returnTokens) return template;
        await warpgate.wait(200);
        let tokens = await game.modules.get('templatemacro').api.findContained(template).map(t => template.parent.tokens.get(t));
        return {'template': template, 'tokens': tokens};
    },
    'placeTemplate': async function _placeTemplate(templateData, returnTokens) {
        let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {'parent': canvas.scene});
        let template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
        let finalTemplate = false;
        try {
            [finalTemplate] = await template.drawPreview();
        } catch {};
        if (!returnTokens) return finalTemplate;
        if (!finalTemplate) return {'template': null, 'tokens': []};
        await warpgate.wait(100);
        let tokens = await game.modules.get('templatemacro').api.findContained(finalTemplate).map(t => finalTemplate.parent.tokens.get(t));
        return {'template': finalTemplate, 'tokens': tokens};
    },
    'animationCheck': async function _animationCheck(item) {
        if (item.flags?.autoanimations?.isEnabled || item.flags['chris-Premades']?.info?.hasAnimation) return true;
        let name = item.name;
        let autorecSettings = [
            game.settings.get('autoanimations', 'aaAutorec-melee'),
            game.settings.get('autoanimations', 'aaAutorec-range'),
            game.settings.get('autoanimations', 'aaAutorec-ontoken'),
            game.settings.get('autoanimations', 'aaAutorec-templatefx'),
            game.settings.get('autoanimations', 'aaAutorec-aura'),
            game.settings.get('autoanimations', 'aaAutorec-preset'),
            game.settings.get('autoanimations', 'aaAutorec-aefx')
        ]
        return autorecSettings.some(setting => setting.some(autoRec => name.toLowerCase().includes(autoRec.label.toLowerCase())));
    },
    'pushToken': async function _pushToken(sourceToken, targetToken, distance) {
        let knockBackFactor;
        let ray;
        let newCenter;
        let hitsWall = true;
        while (hitsWall) {
            knockBackFactor = distance / canvas.dimensions.distance;
            ray = new Ray(sourceToken.center, targetToken.center);
            if (ray.distance === 0) {
                ui.notifications.info('Target is unable to be moved!');
                return;
            }
            newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
            hitsWall = targetToken.checkCollision(newCenter, {'origin': ray.A, 'type': 'move', 'mode': 'any'});
            if (hitsWall) {
                distance += distance > 0 ? -5 : 5;
                if (distance === 0) {
                    ui.notifications.info('Target is unable to be moved!');
                    return;
                }
            }
        }
        newCenter = canvas.grid.getSnappedPosition(newCenter.x - targetToken.w / 2, newCenter.y - targetToken.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x,
                'y': newCenter.y
            }
        };
        let options = {
            'permanent': true,
            'name': 'Move Token',
            'description': 'Move Token'
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    },
    'getGridBetweenTokens': function _getGridBetweenTokens(sourceToken, targetToken, distance) {
        let knockBackFactor = distance / canvas.dimensions.distance;
        let ray = new Ray(sourceToken.center, targetToken.center);
        let extra = 1;
        if (Math.abs(ray.slope) === 1) extra = 1.41;    //todo: Make this less dumb.
        if (ray.distance === 0) return {'x': sourceToken.x, 'y': sourceToken.y};
        let newCenter = ray.project(1 + ((canvas.dimensions.size * extra * knockBackFactor) / ray.distance));
        let cornerPosition = canvas.grid.getTopLeft(newCenter.x, newCenter.y, 1);
        return {'x': cornerPosition[0], 'y': cornerPosition[1]};
    },
    'addDamageDetailDamage': function _addDamageDetailDamage(targetToken, damageTotal, damageType, workflow) {
        let targetDamage = workflow.damageList.find(t => t.tokenId === targetToken.id);
        let targetActor = targetToken.actor;
        if (chris.checkTrait(targetActor, 'di', damageType)) return;
        if (chris.checkTrait(targetActor, 'dr', damageType)) damageTotal = Math.floor(damageTotal / 2);
        targetDamage.damageDetail[0].push(
            {
                'damage': damageTotal,
                'type': damageType
            }
        );
        targetDamage.totalDamage += damageTotal;
        let defaultDamageType = workflow.defaultDamageType;
        if (defaultDamageType === 'healing') {
            targetDamage.newHP += roll.total;
            targetDamage.hpDamage -= damageTotal;
            targetDamage.appliedDamage -= damageTotal;
        } else {
            targetDamage.appliedDamage += damageTotal;
            targetDamage.hpDamage += damageTotal;
            if (targetDamage.oldTempHP > 0) {
                if (targetDamage.oldTempHP >= damageTotal) {
                    targetDamage.newTempHP -= damageTotal;
                } else {
                    let leftHP = damageTotal - targetDamage.oldTempHP;
                    targetDamage.newTempHP = 0;
                    targetDamage.newHP -= leftHP;
                }
            } else {
                targetDamage.newHP -= damageTotal;
            }
        }
    },
    'removeDamageDetailDamage': function _removeDamageDetailDamage(ditem, targetToken, reduction) {
        let absorbed = Math.min(ditem.appliedDamage, reduction);
        let keptDamage = ditem.appliedDamage - absorbed;
        if (ditem.oldTempHP > 0) {
            if (keptDamage > ditem.oldTempHP) {
                ditem.newTempHP = 0;
                keptDamage -= ditem.oldTempHP;
                ditem.tempDamage = ditem.oldTempHP;
            } else {
                ditem.newTempHP = ditem.oldTempHP - keptDamage;
                ditem.tempDamage = keptDamage;
            }
        }
        let maxHP = targetToken.actor.system.attributes.hp.max;
        ditem.hpDamage = Math.clamped(keptDamage, 0, maxHP);
        ditem.newHP = Math.clamped(ditem.oldHP - keptDamage, 0, maxHP);
        ditem.appliedDamage = keptDamage;
        ditem.totalDamage = keptDamage;
    },
    'thirdPartyReactionMessage': async function _thirdPartyReactionMessage(user, dialogMessage, key = true) {
        let playerName = user.name;
        let lastMessage = game.messages.find(m => m.flags?.['chris-premades']?.thirdPartyReactionMessage);
        let subMessage = dialogMessage ? 'a dialog selection' : 'a 3rd party reaction';
        let message = '<hr>Waiting for a ' + subMessage + ' from:<br><b>' + playerName + '</b>';
        if (lastMessage) {
            await lastMessage.update({'content': message});
        } else {
            await ChatMessage.create({
                'speaker': {'alias': 'Chris\'s Premades'},
                'content': message,
                'whisper': game.users.filter(u => u.isGM).map(u => u.id),
                'blind': false,
                'flags': {
                    'chris-premades': {
                        'thirdPartyReactionMessage': key
                    }
                }
            });
        }
    },
    'clearThirdPartyReactionMessage': async function _clearThirdPartyReactionMessage(key = true) {
        let lastMessage = game.messages.find(m => m.flags?.['chris-premades']?.thirdPartyReactionMessage === key && m.user.id === game.user.id);
        if (lastMessage) await lastMessage.delete();
    },
    'lastGM': function _lastGM() {
        return game.settings.get('chris-premades', 'LastGM');
    },
    'isLastGM': function _isLastGM() {
        return game.user.id === chris.lastGM() ? true : false;
    },
    'nth': function _nth(number) {
        return number + (['st','nd','rd'][((number+90)%100-10)%10-1]||'th');
    },
    'levelOrCR': function _levelOrCR(actor) {
        return actor.type === 'character' ? actor.system.details.level : actor.system.details.cr ?? 0;
    },
    'titleCase': function _titleCase(inputString) {
        return inputString.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    },
    'checkCover': function _checkCover(token, target, item, displayName) {
        let cover = MidiQOL.computeCoverBonus(token, target, item);
        if (!displayName) return cover;
        switch (cover) {
            case 0:
                return 'No Cover';
            case 2:
                return 'Half Cover';
            case 5:
                return 'Three-Quarters Cover';
            case 999:
                return 'Full Cover'
            default:
                return 'Unknown Cover';
        }
    },
    'canSense': function _canSense(token, target) {
        return MidiQOL.canSense(token, target);
    },
    'gmDialogMessage': async function _gmDialogMessage() {
        let lastMessage = game.messages.find(m => m.flags?.['chris-premades']?.gmDialogMessage);
        let message = '<hr>Waiting for GM dialogue selection...';
        if (lastMessage) {
            await lastMessage.update({'content': message});
        } else {
            ChatMessage.create({
                'speaker': {'alias': name},
                'content': message,
                'whisper': game.users.filter(u => u.isGM).map(u => u.id),
                'blind': false,
                'flags': {
                    'chris-premades': {
                        'gmDialogMessage': true
                    }
                }
            });
        }
    },
    'clearGMDialogMessage': async function _clearThirdPartyReactionMessage() {
        let lastMessage = game.messages.find(m => m.flags?.['chris-premades']?.gmDialogMessage && m.user.id === game.user.id);
        if (lastMessage) await lastMessage.delete();
    },
    'rollItem': async function _rollItem(item, config, options) {
        return await MidiQOL.completeItemUse(item, config, options);
    },
    'remoteRollItem': async function _remoteRollItem(item, config, options, userId) {
        if (chris.firstOwner(item.actor).id === userId) return await chris.rollItem(item, config, options);
        return await socket.executeAsUser('rollItem', userId, item.uuid, config, options);
    },
    'spawn': async function _spawn(sourceActor, updates = {}, callbacks = {}, summonerToken, range, animation = 'default') {
        let tokenDocument = await sourceActor.getTokenDocument();
        let options = {};
        if (summonerToken?.actor) {
            options = {
                'controllingActor': summonerToken.actor,
                'crosshairs': {
                    'interval': tokenDocument.width % 2 === 0 ? 1 : -1
                }
            };
        }
        if (animation != 'none' && !callbacks.post) {
            let callbackFunction = summonEffects[animation];
            if (typeof callbackFunction === 'function' && chris.jb2aCheck() === 'patreon' && chris.aseCheck()) {
                callbacks.post = callbackFunction;
                setProperty(updates, 'token.alpha', 0);
            }
        }
        if (!callbacks.show) {
            callbacks.show = async (crosshairs) => {
                let distance = 0;
                let ray;
                while (crosshairs.inFlight) {
                    await warpgate.wait(100);
                    ray = new Ray(summonerToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (summonerToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = tokenDocument.texture.src;
                    }
                    crosshairs.draw();
                    crosshairs.label = distance + '/' + range + 'ft.';
                }
            }
        }
        return await warpgate.spawn(tokenDocument, updates, callbacks, options);
    },
    'safeMutate': async function _safeMutate(actor, updates, callbacks = {}, options = {}) {
        let tokens = actor.getActiveTokens();
        let tokenDoc;
        let remove = false;
        if (!tokens.length) {
            if (actor.prototypeToken.actorLink) {
                let doc = await actor.getTokenDocument({
                    'x': 0,
                    'y': 0
                });
                let tokenData = doc.toObject();
                [tokenDoc] = await canvas.scene.createEmbeddedDocuments('Token', [tokenData]);
                remove = true;
            } else {
                ui.notifications.warn('A mutation was attempted on a unlinked actor with no token and has been canceled!');
                return false;
            }
        } else {
            tokenDoc = tokens[0].document;
        }
        await warpgate.mutate(tokenDoc, updates, callbacks, options);
        if (remove) await tokenDoc.delete();
        return true;
    },
    'safeRevert': async function _safeRevert(actor, mutationName, options) {
        let tokens = actor.getActiveTokens();
        let tokenDoc;
        let remove = false;
        if (!tokens.length) {
            if (actor.prototypeToken.actorLink) {
                let doc = await actor.getTokenDocument({
                    'x': 0,
                    'y': 0
                });
                let tokenData = doc.toObject();
                [tokenDoc] = await canvas.scene.createEmbeddedDocuments('Token', [tokenData]);
                remove = true;
            } else {
                ui.notifications.warn('A mutation revert was attempted on a unlinked actor with no token and has been canceled!');
                return false;
            }
        } else {
            tokenDoc = tokens[0].document;
        }
        await warpgate.revert(tokenDoc, mutationName, options);
        return true;
    },
    'vision5e': function _vision5e() {
        return !!game.modules.get('vision-5e')?.active;
    },
    'checkForRoom': function _checkForRoom(token, distance) {
        let point = {'x': token.center.x, 'y': token.center.y};
        let padding = token.w / 2 - canvas.grid.size / 2;
        let pixelDistance = distance * canvas.grid.size + padding;
        function check(direction) {
            let newPoint = duplicate(point);
            switch (direction) {
                case 'n':
                    newPoint.y -= pixelDistance;
                    break;
                case 'e':
                    newPoint.x += pixelDistance;
                    break;
                case 's':
                    newPoint.y += pixelDistance;
                    break;
                case 'w':
                    newPoint.x -= pixelDistance;
                    break;
            }
            return token.checkCollision(newPoint, {'origin': point, 'type': 'move', 'mode': 'any'});
        }
        return {
            'n': check('n'),
            'e': check('e'),
            's': check('s'),
            'w': check('w')
        };
    },
    'findDirection': function _findDirection(room) {
        if (!room.s && !room.e) return 'se';
        if (!room.n && !room.e) return 'ne';
        if (!room.s && !room.w) return 'sw';
        if (!room.w && !room.n) return 'nw';
        return 'none';
    },
    'getCoordDistance': function _getCoordDistance(t1, targetPos) {
        //Adapted from Midi-Qol
        if (!canvas || !canvas.scene) return -1;
        if (!canvas.grid || !canvas.dimensions) return -1;
        let t2 = {
            'document': {
                'height': targetPos.height ?? t1.document.height,
                'width': targetPos.width ?? t1.document.width,
                'x': targetPos.x,
                'y': targetPos.y,
                'elevation': targetPos.elevation
            }
        }
        if (!t1 || !t2) return -1;
        if (!canvas || !canvas.grid || !canvas.dimensions) return -1;
        let t1StartX = t1.document.width >= 1 ? 0.5 : t1.document.width / 2;
        let t1StartY = t1.document.height >= 1 ? 0.5 : t1.document.height / 2;
        let t2StartX = t2.document.width >= 1 ? 0.5 : t2.document.width / 2;
        let t2StartY = t2.document.height >= 1 ? 0.5 : t2.document.height / 2;
        let t1Elevation = t1.document.elevation ?? 0;
        let t2Elevation = t2.document.elevation ?? 0;
        let t1TopElevation = t1Elevation + Math.max(t1.document.height, t1.document.width) * (canvas?.dimensions?.distance ?? 5);
        let t2TopElevation = t2Elevation + Math.min(t2.document.height, t2.document.width) * (canvas?.dimensions?.distance ?? 5);
        let x, x1, y, y1, segments = [], rdistance, distance;
        for (x = t1StartX; x < t1.document.width; x++) {
            for (y = t1StartY; y < t1.document.height; y++) {
                let origin = new PIXI.Point(...canvas.grid.getCenter(Math.round(t1.document.x + (canvas.dimensions.size * x)), Math.round(t1.document.y + (canvas.dimensions.size * y))));
                for (x1 = t2StartX; x1 < t2.document.width; x1++) {
                    for (y1 = t2StartY; y1 < t2.document.height; y1++) {
                        let dest = new PIXI.Point(...canvas.grid.getCenter(Math.round(t2.document.x + (canvas.dimensions.size * x1)), Math.round(t2.document.y + (canvas.dimensions.size * y1))));
                        let r = new Ray(origin, dest);
                        segments.push({'ray': r});
                    }
                }
            }
        }
        if (segments.length === 0) {
            return -1;
        }
        function midiMeasureDistances(segments, options = {}) {
            if (canvas?.grid?.grid.constructor.name !== "BaseGrid" || !options.gridSpaces) {
                let distances = canvas?.grid?.measureDistances(segments, options);
                return distances;
            }
            let rule = canvas?.grid.diagonalRule;
            if (!configSettings.gridlessFudge || !options.gridSpaces || !["555", "5105", "EUCL"].includes(rule)) return canvas?.grid?.measureDistances(segments, options);
            let nDiagonal = 0;
            let d = canvas?.dimensions;
            let grid = canvas?.scene?.grid;
            if (!d || !d.size) return 0;
            let fudgeFactor = configSettings.gridlessFudge / d.distance;
            return segments.map(s => {
                let r = s.ray;
                let nx = Math.ceil(Math.max(0, Math.abs(r.dx / d.size) - fudgeFactor));
                let ny = Math.ceil(Math.max(0, Math.abs(r.dy / d.size) - fudgeFactor));
                let nd = Math.min(nx, ny);
                let ns = Math.abs(ny - nx);
                nDiagonal += nd;
                if (rule === "5105") {
                    let nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
                    let spaces = (nd10 * 2) + (nd - nd10) + ns;
                    return spaces * d.distance;
                }
                else if (rule === "EUCL") {
                    let nx = Math.max(0, Math.abs(r.dx / d.size) - fudgeFactor);
                    let ny = Math.max(0, Math.abs(r.dy / d.size) - fudgeFactor);
                    return Math.ceil(Math.hypot(nx, ny) * grid?.distance);
                }
                else return Math.max(nx, ny) * grid.distance;
            });
        }
        rdistance = segments.map(ray => midiMeasureDistances([ray], {'gridSpaces': true }));
        distance = Math.min(...rdistance);
        let heightDifference = 0;
        let t1ElevationRange = Math.max(t1.document.height, t1.document.width) * (canvas?.dimensions?.distance ?? 5);
        if (Math.abs(t2Elevation - t1Elevation) < t1ElevationRange) {
            heightDifference = 0;
        } else if (t1Elevation < t2Elevation) {
            heightDifference = t2Elevation - t1TopElevation;
        } else if (t1Elevation > t2Elevation) {
            heightDifference = t1Elevation - t2TopElevation;
        }
        let rule = canvas.grid.diagonalRule
        if (['555', '5105'].includes(rule)) {
            let nd = Math.min(distance, heightDifference);
            let ns = Math.abs(distance - heightDifference);
            distance = nd + ns;
            let dimension = canvas?.dimensions?.distance ?? 5;
            if (rule === '5105') distance = distance + Math.floor(nd / 2 / dimension) * dimension;
        }
        distance = Math.sqrt(heightDifference * heightDifference + distance * distance);
        return distance;
    },
    'getEffects': function _getEffects(actor) {
        return Array.from(actor.allApplicableEffects());
    },
    'addToDamageRoll': async function _addToDamageRoll(workflow, bonusDamageFormula, ignoreCrit = false) {
        bonusDamageFormula = String(bonusDamageFormula);
        if (workflow.isCritical && !ignoreCrit) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
        let bonusDamageRoll = await new CONFIG.Dice.DamageRoll(bonusDamageFormula, workflow.actor.getRollData()).evaluate();
        setProperty(bonusDamageRoll, 'options.type', bonusDamageRoll.terms[0].flavor);
        workflow.damageRolls.push(bonusDamageRoll);
        await workflow.setDamageRolls(workflow.damageRolls);
    },
    'damageRoll': async function _damageRoll(workflow, damageFormula, options = {}, ignoreCrit = false) {
        if (workflow.isCritical && !ignoreCrit) damageFormula = chris.getCriticalFormula(damageFormula);
        return await new CONFIG.Dice.DamageRoll(damageFormula, workflow.actor.getRollData(), options).evaluate();
    },
    'damageRolls': async function _damageRolls(workflow, damageFormulas = []) {
        return damageFormulas.map(i => chris.damageRoll(workflow, i));
    }
}