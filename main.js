// map setup

const CENTER = [40.7128, -74.0060]; // New York City
const ZOOM = 13;
const buildingLookup = {};

let selectedZone = null;

const ZONE_COLORS = {
  residential: '#00ff90',
  commercial: '#00d0ff',
  industrial: '#ff8c00'
};

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
const buildings = [
  { name: "School", lat: 40.714, lng: -74.005 },
  { name: "Hospital", lat: 40.716, lng: -74.01 },
  { name: "Library", lat: 40.7155, lng: -74.008 },
  { name: "Market", lat: 40.713, lng: -74.002 }
];

const roads = [
  { from: "School", to: "Library" },
  { from: "Library", to: "Hospital" },
  { from: "School", to: "Market" }
];

function addBuildings(map) {
    buildings.forEach(b => {
        const marker = addBuilding(map, b.name, b.lat, b.lng);
        buildingLookup[b.name] = marker.getLatLng();
    });
}

// helper function to add building
function addBuilding(map, label, lat, lng) {
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>${label}</b><br>Assign Zone`);

    marker.on("click", () => {
    if (!selectedZone) {
        alert("Select a zone first.");    
        return;
    }

    // icon color
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${ZONE_COLORS[selectedZone]};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 8px ${ZONE_COLORS[selectedZone]};">
      </div>`
    });

    marker.setIcon(icon);
    marker.setPopupContent(`<b>${label}</b><br>Zone: ${selectedZone}`);
  });
    return marker;
}

// Add roads between buildings
function addRoads(map) {
    roads.forEach(road => {
    const start = buildingLookup[road.from];
    const end = buildingLookup[road.to];

    if (start && end) {
      L.polyline([start, end], {
        color: '#ff8de6',
        weight: 5,
        dashArray: '4, 8',
        opacity: 0.9
      }).addTo(map);
    } else {
      console.warn(`Missing coordinates for road: ${road.from} → ${road.to}`);
    }
  });
}

/*zonecontrols*/
function setupZoneControls() {
  const buttons = document.querySelectorAll('.zone-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedZone = btn.dataset.zone;

      // Highlight the active button
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Run the map setup
initMap();
setupZoneControls();
