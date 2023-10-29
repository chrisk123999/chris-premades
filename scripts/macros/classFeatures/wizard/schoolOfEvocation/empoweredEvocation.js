export function empoweredEvocation(item) {
    return (item.type === 'spell' && item.system?.school === 'evo') || item.flags?.['chris-premades']?.spell?.castData?.school === 'evo';
}