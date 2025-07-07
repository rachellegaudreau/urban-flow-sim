// map setup

const CENTER = [40.7128, -74.0060]; // New York City
const ZOOM = 13;

// entry point
function initMap() {
    const map = createMap(CENTER, ZOOM);
    addBaseMap(map);
    addBuildings(map);
    addRoads(map);
}

// create/return map object
function createMap(center, zoom) {
    return L.map('map').setView(center, zoom);
}

// base map tiles
function addBaseMap(map) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(map);
}

// building markers
function addBuildings(map) {
    addBuilding(map, "School", 40.714, -74.005);
    addBuilding(map, "Hospital", 40.716, -74.01);
}

// helper function to add building
function addBuilding(map, label, lat, lng) {
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>${label}</b>`);
}

// Add roads between buildings
function addRoads(map) {
    const points = [
        [40.714, -74.005], // School
        [40.715, -74.007], // Turn
        [40.716, -74.01]   // Hospital
    ];

    L.polyline(points, {
        color: '#444',
        weight: 4,
        opacity: 0.8
    }).addTo(map);
}

// Run the map setup
initMap();
