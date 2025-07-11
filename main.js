// map setup

const CENTER = [40.7128, -74.0060]; // New York City
const ZOOM = 15;
const buildingLookup = {};

let selectedZone = null;
let map;

const ZONE_COLORS = {
  residential: '#00ffaa',
  commercial: '#6a5fff',
  industrial: '#d23232'
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

function addBuilding(map, label, lat, lng, zone) {
  // Create custom marker icon
  const marker = L.marker([lat, lng], {
    icon: createZoneIcon(zone)
  }).addTo(map);

  marker.zone = zone || null;
  const b = buildings.find(x => x.name === label);
  if (b) {
    b.zone = zone;
  }

  // Function to render the popup HTML
  function renderPopup() {
    return `
      <b>${label}</b><br>
      Zone: <span class="zone-label">${marker.zone || 'none'}</span><br>
      <button class="assign-zone-btn">Assign Zone</button>
      <div class="zone-popup-options" style="display:none; margin-top:10px;">
        <button class="zone-option" data-zone="residential">Residential</button>
        <button class="zone-option" data-zone="commercial">Commercial</button>
        <button class="zone-option" data-zone="industrial">Industrial</button>
      </div>
    `;
  }

  marker.bindPopup(renderPopup());

  // When popup opens
  marker.on('popupopen', () => {
    const popupEl = marker.getPopup().getElement();
    const assignBtn = popupEl.querySelector('.assign-zone-btn');
    const optionsDiv = popupEl.querySelector('.zone-popup-options');

    assignBtn.onclick = () => {
      optionsDiv.style.display = 'block';
    };

    optionsDiv.querySelectorAll('.zone-option').forEach(optBtn => {
      optBtn.onclick = () => {
        const newZone = optBtn.dataset.zone;
        marker.zone = newZone;

        // Update icon and popup
        marker.setIcon(createZoneIcon(newZone));
        marker.setPopupContent(renderPopup());
        marker.openPopup();

        // Update buildings array if needed
        const b = buildings.find(x => x.name === label);
        if (b) b.zone = newZone;

        // Trigger toggles to refresh visibility
        document.querySelectorAll('#zone-toggles input[type="checkbox"]').forEach(cb =>
          cb.dispatchEvent(new Event('change'))
        );
      };
    });
  });

  return marker;
}

function createZoneIcon(zone) {
  const color = ZONE_COLORS[zone] || '#999';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 8px ${color};
    "></div>`
  });
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

function setupZoneToggles() {
  const checkboxes = document.querySelectorAll('#zone-toggles input[type="checkbox"]');

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const visibleZones = Array.from(checkboxes)
        .filter(c => c.checked)
        .map(c => c.dataset.zone);

      Object.values(buildingLookup).forEach(marker => {
        const zone = marker.zone;

        // Show only if marker zone is in the list
        if (!zone || visibleZones.includes(zone)) {
          if (!map.hasLayer(marker)) map.addLayer(marker);
        } else {
          if (map.hasLayer(marker)) map.removeLayer(marker);
        }
      });
    });
  });
}

document.querySelectorAll('#zone-toggles input[type="checkbox"]').forEach(cb => cb.dispatchEvent(new Event('change')));

// Run the map setup
initMap();
setupZoneToggles();
