export function noAnimation(...args) {
    if (!args[0].flags['chris-premades']?.effect?.noAnimation) return;
    switch (this.hook) {
        case 'preCreateActiveEffect': args[2].animate = false; break;
        case 'preDeleteActiveEffect': args[1].animate = false; break;
    }
}