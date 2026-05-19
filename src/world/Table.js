import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export function createTable() {

    const textureLoader = new THREE.TextureLoader();
    const exrLoader = new EXRLoader();

    const colorMap = textureLoader.load('/table/wood_table_worn_diff_4k.jpg');
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const normalMap = textureLoader.load('/table/wood_table_worn_nor_gl_4k.jpg');

    const roughnessMap = exrLoader.load('/table/wood_table_worn_rough_4k.exr');

    const material = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        roughness: 1,
        normalScale: new THREE.Vector2(0.3, 0.3),
    });

    // TABLE TOP
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.2, 8),
        material
    );

    top.position.y = -1;
    top.receiveShadow = true;
    top.castShadow = true;

    // =========================
    // LEGS
    // =========================
    const legMaterial = material; // reuse same look

    const legGeo = new THREE.BoxGeometry(0.3, 20, 0.3);

    const legs = [];

    const xOffset = 5.5;
    const zOffset = 3.5;
    const yOffset = -11; // below tabletop

    const positions = [
        [ xOffset, yOffset,  zOffset],
        [-xOffset, yOffset,  zOffset],
        [ xOffset, yOffset, -zOffset],
        [-xOffset, yOffset, -zOffset],
    ];

    for (const [x, y, z] of positions) {
        const leg = new THREE.Mesh(legGeo, legMaterial);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        legs.push(leg);
    }

    // GROUP EVERYTHING
    const table = new THREE.Group();
    table.add(top);
    legs.forEach(l => table.add(l));

    return table;
}