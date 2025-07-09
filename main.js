// map setup

const CENTER = [40.7128, -74.0060]; // New York City
const ZOOM = 13;
const buildingLookup = {};

let selectedZone = null;
let map;

const ZONE_COLORS = {
  residential: '#00ff90',
  commercial: '#00d0ff',
  industrial: '#ff8c00'
};

// entry point
function initMap() {
    map = createMap(CENTER, ZOOM);
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

const roads = [
  { from: "School", to: "Library" },
  { from: "Library", to: "Hospital" },
  { from: "School", to: "Market" }
];

function addBuildings(map) {
    buildings.forEach(b => {
        const marker = addBuilding(map, b.name, b.lat, b.lng, b.zone);
        buildingLookup[b.name] = marker;
    });
}

// helper function to add building
function addBuilding(map, label, lat, lng, zone) {
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${ZONE_COLORS[zone] || '#999'};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 8px ${ZONE_COLORS[zone] || '#999'};
    "></div>`
  });

  const marker = L.marker([lat, lng], { icon }).addTo(map);
  marker.zone = zone || null;

  // Set popup with a clickable Assign Zone button
  marker.bindPopup(`
    <b>${label}</b><br>
    Zone: <span class="zone-label">${zone || 'none'}</span><br>
    <button class="assign-zone-btn">Assign Zone</button>
  `);

  // click listener to Assign Zone button
  marker.on('popupopen', () => {
    const popupEl = marker.getPopup().getElement();
    const btn = popupEl.querySelector('.assign-zone-btn');
    if (btn) {
      btn.onclick = () => {
        if (!selectedZone) {
          alert('Select a zone first!');
          return;
        }
        // Update marker zone and icon
        marker.zone = selectedZone;
        const newIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${ZONE_COLORS[selectedZone]};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 8px ${ZONE_COLORS[selectedZone]};
          "></div>`
        });
        marker.setIcon(newIcon);

        // new zone and button
        marker.setPopupContent(`
          <b>${label}</b><br>
          Zone: <span class="zone-label">${selectedZone}</span><br>
          <button class="assign-zone-btn">Assign Zone</button>
        `);

        // Reopen popup
        marker.openPopup();

        // update buildings array zone for toggles
        const b = buildings.find(x => x.name === label);
        if (b) b.zone = selectedZone;
      };
    }
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

function setupZoneToggles() {
  const checkboxes = document.querySelectorAll('#zone-toggles input[type="checkbox"]');

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const visibleZones = Array.from(checkboxes)
        .filter(c => c.checked)
        .map(c => c.dataset.zone);

      Object.values(buildingLookup).forEach(marker => {
        if (!marker.zone) {
          map.removeLayer(marker);
          return;
        }

        if (visibleZones.includes(marker.zone)) {
          map.addLayer(marker);
        } else {
          map.removeLayer(marker);
        }
      });
    });
  });
}



// Run the map setup
initMap();
setupZoneControls();
setupZoneToggles();
