import {
  AccumulativeShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
  RandomizedLight,
  Sphere,
  useGLTF,
} from "@react-three/drei";

import * as THREE from "three";

import React, { useEffect, useRef, useState,  } from "react";
import { useFrame } from "@react-three/fiber";
import { DEG2RAD } from "three/src/math/MathUtils";
import { useAnimations } from "@react-three/drei";


export const Scene = ({ mainColor, path, ...props }) => {
  const { nodes, materials, animations, scene } = useGLTF(path);
  const group = useRef();

  // Use animations with the group ref
  const { actions, mixer  } = animations ? useAnimations(animations, group) : { actions: {} };
 
console.log(animations, 'animations')
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const animationSequence = ['CharacterArmature|Wave', 'CharacterArmature|HitReact','CharacterArmature|Idle','CharacterArmature|Yes' ]; // Example sequence
   const zombieSequence = ['Armature|Idle', 'Armature|Walk','Armature|Attack','Armature|Death' ]; // Example sequence
  // Function to play a specific animation
  const animationTimeoutRef = useRef();
  

  
  const playAnimation = (animationName, onFinish) => {
    if (actions[animationName]) {
      const action = actions[animationName];
      action.reset().play();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      setCurrentAnimation(animationName);
  
      // Set the onFinish callback if provided
      if (typeof onFinish === "function") {
        action.onFinish = onFinish;
      }
    }
  };
  
  // Replace with actual initial scale

 
  const resetCharacter = () => {
    playAnimation('CharacterArmature|Idle'); // Play 'Stand-Up' animation
    setTimeout(() => playAnimation('CharacterArmature|Wave'), 3000); // Then play 'Wave' after a delay
  };
  
  useEffect(() => {
    // Check if the animation exists before starting it
    if (mixer && animations) {
      let take01AnimationClip = animations.find((clip) => clip.name === 'Take 01');
      console.log(take01AnimationClip ,'take01AnimationClip')
      if (take01AnimationClip) {
        const action = mixer.clipAction(take01AnimationClip, group.current);
        action.reset().play();
        action.setLoop(THREE.LoopRepeat, Infinity); // Set to loop indefinitely
        action.clampWhenFinished = true;
        setCurrentAnimation('Take 01');
      }
    }
  }, [mixer, animations]);


    
  useEffect(() => {
    // Check if the animation exists before starting it
    if (mixer && animations) {
      let take01AnimationClip = animations.find((clip) => clip.name === 'Armature|Idle');
     
      if (take01AnimationClip) {
        const action = mixer.clipAction(take01AnimationClip, group.current);
        action.reset().play();
        action.setLoop(THREE.LoopRepeat, Infinity); // Set to loop indefinitely
        action.clampWhenFinished = true;
        setCurrentAnimation('Armature|Idle');
      }
    }
  }, [mixer, animations]);
  
  
  const handleTap = () => {
    playAnimation("Armature|Hit_reaction", () => {
      playAnimation("Armature|Attack", () => {
        setTimeout(() => {
          playAnimation("Armature|Attack");
        }, 1000);
      });
    });
  };

  //zombie attack every few seconds 
  useEffect(() => {
    if (mixer && animations) {
      // Find the clips for 'Armature|Attack' and 'Armature|Scream'
      const attackClip = animations.find((clip) => clip.name === 'Armature|Attack');
      const screamClip = animations.find((clip) => clip.name === 'Armature|Bite_ground');
  
      if (attackClip && screamClip) {
        // Create actions for both animations
        const attackAction = mixer.clipAction(attackClip, group.current);
        const screamAction = mixer.clipAction(screamClip, group.current);
  
        // Start 'Armature|Attack' animation
        attackAction.reset().play();
        attackAction.setLoop(THREE.LoopRepeat, Infinity);
        attackAction.clampWhenFinished = true;
        setCurrentAnimation('Armature|Attack');
  
        // Start 'Armature|Scream' animation with a delay
        setTimeout(() => {
          screamAction.reset().play();
          screamAction.setLoop(THREE.LoopRepeat, Infinity);
          screamAction.clampWhenFinished = true;
          setCurrentAnimation('Armature|Bite');
        }, 10000); // Delay for 5 seconds (adjust as needed)
      }
    }
  }, [mixer, animations]);



  // Add a click event listener to the window
  useEffect(() => {
    window.addEventListener("click", handleTap);
    console.log('window.addEventListener("click", handleTap)')

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("click", handleTap);
    };
  }, []);
 

  // Use useFrame to update the mixer



 
  const handleAnimationChange = () => {
    // Prevent changing animation if the character is "dead"
    if (currentAnimation !== 'CharacterArmature|Death') {
      const currentIndex = animationSequence.indexOf(currentAnimation);
      const nextIndex = (currentIndex + 1) % animationSequence.length;
      playAnimation(animationSequence[nextIndex]);
    }
  };
  
  useEffect(() => {
if (currentAnimation === 'Take 01', 'Take 02') {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(resetCharacter, 3000);
    }
  }, [mixer, animations, group]);

  // Use useFrame to update the mixer
  useFrame((state, delta) => {
    mixer?.update(delta);
  });
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);


  const ratioScale = Math.min(2.2, Math.max(0.6, window.innerWidth / 1920));
  
  
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <group ref={group} onClick={handleAnimationChange}    {...props} dispose={null}>
        <PerspectiveCamera makeDefault position={[3, 3, 8]} near={0.5} />
        <OrbitControls
          
          enablePan={false}
          maxPolarAngle={DEG2RAD * 75}
          minDistance={6}
          maxDistance={10}
          autoRotateSpeed={0.5}
        />
        <primitive object={scene} scale={ratioScale} />
        <ambientLight intensity={0.1} color="pink" />
        <AccumulativeShadows
          frames={100}
          alphaTest={0.9}
          scale={30}
          position={[0, -0.005, 0]}
          color="pink"
          opacity={0.8}
        >
          <RandomizedLight
            amount={4}
            radius={9}
            intensity={0.8}
            ambient={0.25}
            position={[10, 5, 15]}
          />
          <RandomizedLight
            amount={4}
            radius={5}
            intensity={0.5}
            position={[-5, 5, 15]}
            bias={0.001}
          />
        </AccumulativeShadows>
        <Environment blur={0.8} background>
          <Sphere scale={15}>
            <meshBasicMaterial color={mainColor} side={THREE.BackSide} />
          </Sphere>
          <Lightformer
            position={[5, 0, -5]}
            form="rect" // circle | ring | rect (optional, default = rect)
            intensity={1} // power level (optional = 1)
            color="red" // (optional = white)
            scale={[3, 5]} // Scale it any way you prefer (optional = [1, 1])
            target={[0, 0, 0]}
          />

          <Lightformer
            position={[-5, 0, 1]}
            form="circle" // circle | ring | rect (optional, default = rect)
            intensity={1} // power level (optional = 1)
            color="green" // (optional = white)
            scale={[2, 5]} // Scale it any way you prefer (optional = [1, 1])
            target={[0, 0, 0]}
          />

          <Lightformer
            position={[0, 5, -2]}
            form="ring" // circle | ring | rect (optional, default = rect)
            intensity={0.5} // power level (optional = 1)
            color="orange" // (optional = white)
            scale={[10, 5]} // Scale it any way you prefer (optional = [1, 1])
            target={[0, 0, 0]}
          />
          <Lightformer
            position={[0, 0, 5]}
            form="rect" // circle | ring | rect (optional, default = rect)
            intensity={1} // power level (optional = 1)
            color="purple" // (optional = white)
            scale={[10, 5]} // Scale it any way you prefer (optional = [1, 1])
            target={[0, 0, 0]}
          />
        </Environment>
      </group>
    </>
  );
};

useGLTF.preload("/models/cybertruck_scene.glb");
useGLTF.preload("/models/model3_scene.glb");
useGLTF.preload("/models/semi_scene.glb");
useGLTF.preload("/models/Low Building.glb");
useGLTF.preload("/models/Astronaut.glb");

