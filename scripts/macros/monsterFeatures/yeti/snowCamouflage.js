export function snowCamouflage(skillId, options) {
    return skillId != 'ste' ? false : {'label': 'This check involves hiding in snowy terrain.', 'type': 'advantage'};
}