//  this file is used to pre-load textures for teh ball materials
import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader();

export let ballTextures = {};

export function load() {
    const metalAlbedo = textureLoader.load(
        "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_BaseColor.jpg",
    );
    metalAlbedo.colorSpace = THREE.SRGBColorSpace;
    const metalMetal = textureLoader.load(
        "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Metallic.jpg",
    );
    metalMetal.colorSpace = THREE.NoColorSpace;
    const metal_nor = textureLoader.load(
        "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Normal.png",
    );
    metal_nor.colorSpace = THREE.NoColorSpace;
    const metal_ao = textureLoader.load(
        '/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_AmbientOcclusion.jpg',
    );
    metal_ao.colorSpace = THREE.NoColorSpace;
    const metal_rough = textureLoader.load(
        "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Roughness.jpg",
    );
    metal_rough.colorSpace = THREE.NoColorSpace;
    const metal_disp = textureLoader.load(
        "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Displacement.jpg",
    );
    metal_disp.colorSpace = THREE.NoColorSpace;


    const rubberAlbedo = textureLoader.load(
        "/balls/Rubber/rubberized_track_diff_1k.jpg",
    );
    rubberAlbedo.colorSpace = THREE.SRGBColorSpace;
    const rubber_arm = textureLoader.load(
        "/balls/Rubber/rubberized_track_arm_1k.jpg",
    );
    rubber_arm.colorSpace = THREE.NoColorSpace;
    const rubberDisp = textureLoader.load(
        "/balls/Rubber/rubberized_track_disp_1k.png",
    );
    rubberDisp.colorSpace = THREE.NoColorSpace;
    const rubberNor = textureLoader.load(
        "/balls/Rubber/rubberized_track_nor_gl_1k.png",
    );
    rubberNor.colorSpace = THREE.NoColorSpace;


    const wood_diff = textureLoader.load(
        "/balls/Wood/herringbone_parquet_diff_1k.jpg",
    );
    wood_diff.colorSpace = THREE.SRGBColorSpace;
    const wood_arm = textureLoader.load(
        "/balls/Wood/herringbone_parquet_arm_1k.jpg",
    );
    wood_arm.colorSpace = THREE.NoColorSpace;
    const wood_disp = textureLoader.load(
        "/balls/Wood/herringbone_parquet_disp_1k.png",
    );
    wood_disp.colorSpace = THREE.NoColorSpace;
    const wood_nor = textureLoader.load(
        "/balls/Wood/herringbone_parquet_nor_gl_1k.png",
    );
    wood_nor.colorSpace = THREE.NoColorSpace;

    ballTextures = {
        metalAlbedo,
        metalMetal,
        metal_ao,
        metal_disp,
        metal_nor,
        metal_rough,

        rubberAlbedo,
        rubberDisp,
        rubberNor,
        rubber_arm,

        wood_arm,
        wood_diff,
        wood_disp,
        wood_nor
    }
}