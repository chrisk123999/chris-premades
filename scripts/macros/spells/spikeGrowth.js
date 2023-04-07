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
        let intersectionPoint = quadraticIntersection(previousTokenCenter, currentTokenCenter, template.object.center, template.object.shape.radius, epsilon=0);
        if (intersectionPoint.length === 0) return;
        let ray = new Ray(intersectionPoint[0], currentTokenCenter);
        cellDistance = (Math.ceil(ray.distance / canvas.scene.grid.size));
    }
    let scale = Math.ceil(canvas.scene.grid.distance / 5);
    let distance = cellDistance * scale;
    if (distance <= 0) return;
    for (let i = 0; i < distance; i++) {
        let damageDice = '2d4[piercing]';
        let diceRoll = await new Roll(damageDice).roll({async: true});
        diceRoll.toMessage({
            rollMode: 'roll',
            speaker: {alias: name},
            flavor: 'Spike Growth'
        });
        let token = canvas.tokens.get(data.tokenId);
        await chris.applyDamage([token], diceRoll.total, 'piercing');
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
        let intersectionPoint = quadraticIntersection(previousTokenCenter, currentTokenCenter, template.object.center, template.object.shape.radius, epsilon=0);
        if (intersectionPoint.length === 0) return;
        let ray = new Ray(intersectionPoint[0], currentTokenCenter);
        cellDistance = (Math.ceil(ray.distance / canvas.scene.grid.size));
    }
    let scale = Math.ceil(canvas.scene.grid.distance / 5);
    let distance = cellDistance * scale;
    if (distance <= 0) return;
    for (let i = 0; i < distance; i++) {
        let damageDice = '2d4[piercing]';
        let diceRoll = await new Roll(damageDice).roll({async: true});
        diceRoll.toMessage({
            rollMode: 'roll',
            speaker: {alias: name},
            flavor: 'Spike Growth'
        });
        let token = canvas.tokens.get(data.tokenId);
        await chris.applyDamage([token], diceRoll.total, 'piercing');
    }
}
export let spikeGrowth = {
    'enterLeave': spikeGrowthEnterLeave,
    'staying': spikeGrowthStaying
}