import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Scene and camera setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);
const loader = new GLTFLoader();


//bloom renderer
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 2; //intensity of glow
bloomPass.radius = 0;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

//Textures loader
const textureLoader = new THREE.TextureLoader();
const SaturnRingTexture = textureLoader.load('saturnRing.png');
const MoonTexture = textureLoader.load('MoonTexture.jpg');
const starsTextureUrl = '/stars.jpg';

//Background texture
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
]);

// Stars Background
const stars = [];
function addStar() {
  const geometry = new THREE.SphereGeometry(0.05, 24, 24);
  const material = new THREE.MeshStandardMaterial({ map: SaturnRingTexture, emissive: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(
    camera.position.x + x,
    camera.position.y + y,
    camera.position.z + z
  );
  stars.push(star);
  scene.add(star);
}

Array(500).fill().forEach(addStar);

//Controls
const clock = new THREE.Clock();
//const controls = new OrbitControls( camera, renderer.domElement );
let nameTigrouto = false; // Default name


// Moon
const Moongeometry = new THREE.SphereGeometry( 500, 32, 32 );
const Moonmaterial = new THREE.MeshStandardMaterial( { map: MoonTexture } );
const sphere = new THREE.Mesh( Moongeometry, Moonmaterial );
sphere.position.set(0, 0, -10000);
scene.add( sphere );

// Rocket
const Rocket = new THREE.Object3D();
let rocketModel;


// Fire
const Fire = new THREE.Object3D();
loader.load( 'rocket/Fire.glb', function ( fire ) {
    if(nameTigrouto === false){
        fire.scene.scale.set(3, 3, 3);
        fire.scene.position.set(0, -2, 0);
        fire.scene.rotation.set(-80, 0, 0);
        Fire.add(fire.scene);
    }
    //Rocket.add(fire.scene);
    //Fire.add(localLight);
    //scene.add( Fire );
}, undefined, function ( error ) {

    console.error( error );
});


const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);


/*const helper = new THREE.PointLightHelper(localLight, 1); // 1 = taille
scene.add(helper);*/

const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.position.set(100, 100, -100); // direction de la lumière
scene.add(sunLight);


// Camera Position
camera.position.z = 5;
let currentCarburant = 100;
const maxCarburant = 100;
let gameStarted = false;
let StopCamera = true;

// void Update 
function animate() {
    const delta = clock.getDelta();
    const speedRocket = 5; // 5 unité/seconde
    const moveDistance = speedRocket * delta;

    let speedCamera = 1100; // 33 unité/seconde

    if(gameStarted === true) {
        Rocket.add(Fire);
        if(StopCamera === false) {
            const moveCameraDistance = speedCamera * delta;
            camera.position.z -= moveCameraDistance;
            Rocket.position.z -= moveCameraDistance;
        }

        // Mettre à jour la distance affichée
        const distanceValue = document.getElementById('distanceValue');
        distanceValue.textContent = Math.abs(Math.floor((-9450) - camera.position.z));
        const progressBar = document.getElementById('progressBar');
        const maxDistance = 10000;
        const currentDistance = Math.abs(Math.floor((-9450)- camera.position.z));
        progressBar.value = Math.min(currentDistance, maxDistance);

        const carburantBar = document.getElementById('carburantBar');
        const carburantValue = document.getElementById('carburantValue');
        currentCarburant -= 2 * delta;
        carburantValue.textContent = Math.floor(currentCarburant);

        carburantBar.value = currentCarburant;
        // Si le carburant est épuisé, on arrête le jeu
        if (currentCarburant <= 0) {
            alert('Game Over! You have run out of fuel.');
            currentCarburant = 0;
            renderer.setAnimationLoop(null); // Stop the animation loop
            return;
        }

        if (Rocket.position.z <= (-9450)) {
            alert('You Win ! Boom.');
            StopCamera = true;
            speedCamera = 0.5;
            gameStarted = false;
            
            //renderer.setAnimationLoop(null); // Stop the animation loop
            //return;
        }

        // Boucle sur les étoiles existantes
        stars.forEach(star => {
          // Déplacer la star vers l’arrière
          star.position.z += (speedCamera - 25) * delta * 10;

          // Si l’étoile est trop loin derrière la caméra, on la replace devant
          if (star.position.z > camera.position.z + 50) {
            // Repositionne autour de la caméra, devant
            const [x, y, z] = Array(3)
              .fill()
              .map(() => THREE.MathUtils.randFloatSpread(100));
            star.position.set(
              camera.position.x + x,
              camera.position.y + y,
              camera.position.z - 50 + z  // Toujours devant la caméra
            );
          }
        });

        if (keysPressed.ArrowUp && Rocket.position.y <= 5) {
            Rocket.position.y += moveDistance;
        }
        if (keysPressed.ArrowDown && Rocket.position.y >= -1) {
            Rocket.position.y -= moveDistance;
        }
        if (keysPressed.ArrowRight && Rocket.position.x <= 5) {
            Rocket.position.x += moveDistance;
        }
        if (keysPressed.ArrowLeft && Rocket.position.x >= -5) {
            Rocket.position.x -= moveDistance;
        }
    }
    if(gameStarted === false) {
        
        // Boucle sur les étoiles existantes
        stars.forEach(star => {
          // Déplacer la star vers l’arrière
          star.position.z += (speedCamera - 32.5) * delta * 10;

          // Si l’étoile est trop loin derrière la caméra, on la replace devant
          if (star.position.z > camera.position.z + 50) {
            // Repositionne autour de la caméra, devant
            const [x, y, z] = Array(3)
              .fill()
              .map(() => THREE.MathUtils.randFloatSpread(100));
            star.position.set(
              camera.position.x + x,
              camera.position.y + y,
              camera.position.z - 50 + z  // Toujours devant la caméra
            );
          }
        });
    }


    sphere.rotation.y += 0.3 * delta;

    bloomComposer.render();
}


// Keyboard controls
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});
const keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};


// Resize window
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
});


document.getElementById("startButton").addEventListener("click", function() {
    document.getElementById("HelpMenu").style.display = "none";
    document.getElementById("Menu").style.display = "none";
    gameStarted = true;
    StopCamera = false;
    currentCarburant = maxCarburant;
});



const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
if (name === "tigrouto") {
    console.log("Bienvenue Tigrouto !");
    nameTigrouto = true;
    console.log("Changement du model !");
    loader.load( 'rocket/scene.gltf', function ( rocket ) {
        rocket.scene.scale.set(0.3, 0.3, 0.3);
        rocket.scene.position.set(0, -2, 0);
        rocket.scene.rotation.set(0,-80,0);
        rocketModel = rocket.scene;
        Rocket.add(rocketModel);
        
        const localLight = new THREE.PointLight(0xffffff, 15, 50); // couleur, intensité, portée
        localLight.position.set(0, 5, 0); // placer au centre du Rocket

        Rocket.add(localLight);
        scene.add( Rocket );
    }, undefined, function ( error ) {
        console.error( error );
    });
}   
else{
    console.log("Bienvenue inconnu !");
    loader.load( 'rocket/Rocketship.glb', function ( rocket ) {
        rocket.scene.scale.set(0.2, 0.2, 0.2);
        rocket.scene.position.set(0, -2, 0);
        rocket.scene.rotation.set(80, 0, 0);
        rocketModel = rocket.scene;
        Rocket.add(rocketModel);
        
        const localLight = new THREE.PointLight(0xffffff, 15, 50); // couleur, intensité, portée
        localLight.position.set(0, 0, 0); // placer au centre du Rocket
        Rocket.add(localLight);
        scene.add( Rocket );
    }, undefined, function ( error ) {
    
        console.error( error );
    });
}
