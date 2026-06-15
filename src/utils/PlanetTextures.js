import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

const planetsConfig = [
    { name: 'SUN', texturePath: '/planets/2k_sun.jpg', radius: 150, },
    { name: 'MERCURY', texturePath: '/planets/2k_mercury.jpg', radius: 19, y: -300 },
    { name: 'VENUS', texturePath: '/planets/2k_venus.jpg', radius: 47, y: -800 },
    { name: 'MARS', texturePath: '/planets/2k_mars.jpg', radius: 27, y:-420 },
    { name: 'JUPITER', texturePath: '/planets/2k_jupiter.jpg', radius: 100, y:-1750 },  //for rendering sake, the radius was made unrealistically smaller
    { name: 'SATURN', texturePath: '/planets/2k_saturn.jpg', radius: 100, y:-1750 },    //for rendering sake, the radius was made unrealistically smaller
    { name: 'URANUS', texturePath: '/planets/2k_uranus.jpg', radius: 100, y:-1750 },    //for rendering sake, the radius was made unrealistically smaller
    { name: 'NEPTUNE', texturePath: '/planets/2k_neptune.jpg', radius: 100, y:-1750 },          //for rendering sake, the radius was made unrealistically smaller
    { name: 'PLUTO', texturePath: '/planets/2k_pluto.jpg', radius: 10, y: -180 },
    { name: 'MOON', texturePath: '/planets/2k_moon.jpg', radius: 14 },
    { name: 'STRATOSPHERE', texturePath: '/planets/2k_earth.jpg', radius: 50, y: -800 }
];

export const spaceTexture = textureLoader.load('/planets/space.png', (texture) => {
    texture.magFilter = THREE.EquirectangularReflectionMapping;
});
export const issTexture = textureLoader.load('/planets/iss.jpeg', (texture) => {
    texture.magFilter = THREE.EquirectangularReflectionMapping;
});

export async function initializePlanets() {
    const planets = [];

    for (const config of planetsConfig) {
        try {
            const texture = await new Promise((resolve, reject) => {
                textureLoader.load(config.texturePath, resolve, undefined, reject);
            });

            texture.colorSpace = THREE.SRGBColorSpace;
            if (config.name === 'SUN') {
                const geometry = new THREE.SphereGeometry(config.radius * 20, 64, 64);

                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                });

                const mesh = new THREE.Mesh(geometry, material);

                const pointLight = new THREE.PointLight(planetsConfig[0].emissive, 50, 3400, 0);
                mesh.add(pointLight)

                mesh.position.set(0, -3100, 0);
                mesh.visible = false;
                mesh.userData.name = config.name;

                mesh.castShadow = false;
                mesh.receiveShadow = false;

                planets.push({
                    name: config.name,
                    mesh: mesh,
                    texture: texture,
                    config: config
                });

            }
            else {

                const geometry = new THREE.SphereGeometry(config.radius * 15, 64, 64);

                const material = new THREE.MeshPhongMaterial({
                    map: texture,
                    shininess: config.name === 'SUN' ? 10 : 5,
                });

                if (config.emissive) {
                    material.emissive = new THREE.Color(config.emissive);
                    material.emissiveIntensity = 0.3;
                }

                const mesh = new THREE.Mesh(geometry, material);

                mesh.position.set(0, config.y || -400, 0);
                mesh.visible = false;
                mesh.userData.name = config.name;

                planets.push({
                    name: config.name,
                    mesh: mesh,
                    texture: texture,
                    config: config
                });

            }
            console.log(`${config.name} loaded`);
        } catch (error) {
            console.error(`Failed to load ${config.name}:`, error);
        }
    }

    return planets;
}