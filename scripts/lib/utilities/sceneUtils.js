/* TODO: This uses cartesian... not ideal since most people use 5/5/5 or 5/10/5 rather than cartesian... */
function fromLightCenter(light, coord) {
    let distance = Math.hypot((light.data.x - coord.x), (light.data.y - coord.y));
    if (coord.z) distance = Math.hypot(distance, (light.data.elevation - coord.z));
    return distance;
}

function getLightLevel(coord = {x, y, z}) {
    let lights = canvas.effects.lightSources.filter(src => !(src instanceof foundry.canvas.sources.GlobalLightSource));
    let bright = lights.filter(src => fromLightCenter(src, coord) <= src.data.bright);
    if (bright.length) return 'bright';
    let dim = lights.filter(src => fromLightCenter(src, coord) <= src.data.dim);
    if (dim.length) return 'dim';
    return 'dark';
}

export let sceneUtils = {
    getLightLevel
};