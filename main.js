import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { request } from './src';

    // Gen random paths
    const N_PATHS = 10;
    const MAX_POINTS_PER_LINE = 10000;
    const MAX_STEP_DEG = 1;
    const MAX_STEP_ALT = 0.015;
    const gData = [...Array(N_PATHS).keys()].map(() => {
      let lat = (Math.random() - 0.5) * 90;
      let lng = (Math.random() - 0.5) * 360;
      let alt = 0;

      return [[lat, lng, alt], ...[...Array(Math.round(Math.random() * MAX_POINTS_PER_LINE)).keys()].map(() => {
        lat += (Math.random() * 2 - 1) * MAX_STEP_DEG;
        lng += (Math.random() * 2 - 1) * MAX_STEP_DEG;
        alt += (Math.random() * 2 - 1) * MAX_STEP_ALT;
        alt = Math.max(0, alt);

        return [lat, lng, alt];
      })];
    });

    const Globe = new ThreeGlobe({ animateIn: false })
      .globeImageUrl('/assets/earth-dark.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .pathsData(gData)
      .pathColor(() => ['rgba(0,0,255,0.8)', 'rgba(255,0,0,0.8)'])
      .pathDashLength(0.01)
      .pathDashGap(0.004)
      .pathDashAnimateTime(100000);

    setTimeout(() => {
      Globe
        .pathPointAlt(pnt => pnt[2]) // set altitude accessor
        .pathTransitionDuration(4000)
    }, 6000);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('globeViz')?.appendChild(renderer.domElement);

    // Setup scene
    const scene = new THREE.Scene();
    scene.add(Globe);
    scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
    scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));

    // Setup camera
    const camera = new THREE.PerspectiveCamera();
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    camera.position.z = 500;

    // Add camera controls
    const tbControls = new TrackballControls(camera, renderer.domElement);
    tbControls.minDistance = 101;
    tbControls.rotateSpeed = 5;
    tbControls.zoomSpeed = 0.8;

    window.drawPath = async () => {
      const fromCity = document.getElementById('fromCity').value;
      const toCity = document.getElementById('toCity').value;
      const fromCityCoordinates = await request(`https://api.api-ninjas.com/v1/city?name=${fromCity}`)
      const toCityCoordinates = await request(`https://api.api-ninjas.com/v1/city?name=${toCity}`);

      console.log(fromCityCoordinates.length, toCityCoordinates.length);

      if (fromCityCoordinates.length <= 0 || toCityCoordinates.length <= 0) {
        alert('Invalid city names. Please try again.');
        return;
      }

      // Get coordinates
      const fromCoords = fromCityCoordinates.map((city) => [city.latitude, city.longitude])[0];
      const toCoords = toCityCoordinates.map((city) => [city.latitude, city.longitude])[0];

      // Clear previous paths
      Globe.pathsData([]);
      document.getElementById("labels-container").innerHTML = "";

      // Create new path data
      const pathData = [
        [
        [fromCoords[0], fromCoords[1], 0],
        [toCoords[0], toCoords[1], 0.2]
        ] // End point with altitude (curve effect)
      ];

      Globe
        .pathsData(pathData)
        .pathColor(() => ['rgba(0,255,0,0.8)', 'rgba(255,255,0,0.8)']) // Gradient from green to yellow
        .pathDashLength(0.01)
        .pathDashGap(0.004)
        .pathDashAnimateTime(4000)
        .pathPointAlt(() => 0.2);

        // Show distance in the middle
        const midLat = (fromCoords[0] + toCoords[0]) / 2;
        const midLng = (fromCoords[1] + toCoords[1]) / 2;
        const distance = calculateDistance(fromCoords, toCoords);
        addCityLabel(midLat, midLng, `${distance.toFixed(2)} km`);

    };
    function latLngToXYZ(lat, lng, radius = 1) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      return [x, y, z];
    }

    function latLngToScreenPosition(lat, lng) {
      const [x, y, z] = latLngToXYZ(lat, lng, 1.01); // Convert lat/lng to 3D
      const vector = new THREE.Vector3(x, y, z);

      // Project 3D position to 2D screen coordinates
      vector.project(camera);

      // Convert normalized device coordinates to screen pixels
      const widthHalf = window.innerWidth / 2;
      const heightHalf = window.innerHeight / 2;

      return {
        x: (vector.x * widthHalf) + widthHalf,
        y: -(vector.y * heightHalf) + heightHalf
      };
    }
    function addCityLabel(lat, lng, cityName) {
      const screenPos = latLngToScreenPosition(lat, lng);

      const label = document.createElement("div");
      label.className = "city-label";
      label.innerText = cityName;
      label.style.position = "absolute";
      label.style.left = `${screenPos.x}px`;
      label.style.top = `${screenPos.y}px`;
      label.style.color = "white";
      label.style.fontSize = "14px";
      label.style.fontWeight = "bold";
      label.style.pointerEvents = "none";

      document.getElementById("labels-container").appendChild(label);
    }

    function calculateDistance(coords1, coords2) {
      const R = 6371; // Radius of Earth in km
      const lat1 = (coords1[0] * Math.PI) / 180;
      const lon1 = (coords1[1] * Math.PI) / 180;
      const lat2 = (coords2[0] * Math.PI) / 180;
      const lon2 = (coords2[1] * Math.PI) / 180;

      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    }


    // Kick-off renderer
    (function animate() { // IIFE
      // Frame cycle
      tbControls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    })();
