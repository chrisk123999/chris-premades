import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function spikeGrowthEnterLeave(data, template) {
    if (canvas.scene.grid.units != 'ft') return;
    if (data.hook.animate === false) return;
    let cellDistance;
    if (canvas.scene.grid.type != 0) {
        let through = data.hook.templatemacro.through.find(tmp => tmp.templateId === template.id);
        if (!through) return;
        cellDistance = through.cells.length;
    } else {
        let token = canvas.tokens.get(data.tokenId);
        let currentTokenCenter = {
            x: data.coords.current.x + (token.w / 2),
            y: data.coords.current.y + (token.w / 2)
        };
        let previousTokenCenter = {
            x: data.coords.previous.x + (token.w / 2),
            y: data.coords.previous.y + (token.w / 2)
        };
        // eslint-disable-next-line no-undef
        let intersectionPoint = quadraticIntersection(previousTokenCenter, currentTokenCenter, template.object.center, template.object.shape.radius);
        if (intersectionPoint.length === 0) return;
        let ray = new Ray(intersectionPoint[0], currentTokenCenter);
        cellDistance = (Math.ceil(ray.distance / canvas.scene.grid.size));
    }
    let scale = Math.ceil(canvas.scene.grid.distance / 5);
    let distance = cellDistance * scale;
    if (distance <= 0) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Spike Growth - Thorns', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Spike Growth - Thorns');
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let token = canvas.tokens.get(data.tokenId);
    if (!token) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    for (let i = 0; i < distance; i++) {
        if (i > 0) await (warpgate.wait(100));
        await MidiQOL.completeItemUse(feature, config, options);
    }
}
async function spikeGrowthStaying(data, template) {
    if (canvas.scene.grid.units != 'ft') return;
    if (data.hook.animate === false) return;
    let cellDistance;
    if (canvas.scene.grid.type != 0) {
        let through = data.hook.templatemacro.through.find(tmp => tmp.templateId === template.id);
        if (!through) return;
        cellDistance = through.cells.length - 1;
    } else {
        let token = canvas.tokens.get(data.tokenId);
        let currentTokenCenter = {
            x: data.coords.current.x + (token.w / 2),
            y: data.coords.current.y + (token.w / 2)
        };
        let previousTokenCenter = {
            x: data.coords.previous.x + (token.w / 2),
            y: data.coords.previous.y + (token.w / 2)
        };
        // eslint-disable-next-line no-undef
        let intersectionPoint = quadraticIntersection(previousTokenCenter, currentTokenCenter, template.object.center, template.object.shape.radius);
        if (intersectionPoint.length === 0) return;
        let ray = new Ray(intersectionPoint[0], currentTokenCenter);
        cellDistance = (Math.ceil(ray.distance / canvas.scene.grid.size));
    }
    let scale = Math.ceil(canvas.scene.grid.distance / 5);
    let distance = cellDistance * scale;
    if (distance <= 0) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Spike Growth - Thorns', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Spike Growth - Thorns');
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let token = canvas.tokens.get(data.tokenId);
    if (!token) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    for (let i = 0; i < distance; i++) {
        if (i > 0) await (warpgate.wait(100));
        await MidiQOL.completeItemUse(feature, config, options);
    }
}
export let spikeGrowth = {
    'enterLeave': spikeGrowthEnterLeave,
    'staying': spikeGrowthStaying
};