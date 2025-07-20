// map setup
const MapManager = (function() {
  let tempMarker = null;
  let addBuildingPopup = null;  
  let selectedNewBuild = 'residential';
  let map;
  // track markers on board
  const markerLookup = {};
  let editMode = false;
  
  const ZONE = {
    residential: '#00ffaa',
    commercial: '#6a5fff',
    industrial: '#d23232',
    none: '#999'
  };

  // store original colors for edit mode
  const originalColors = { ...ZONE };

  function init() {
    setupMap();
    refreshBuildings();
    setupZoneToggles();
    setupEditMode();
    setupBuildingControls();
  }

  function setupMap() {
    map = L.map('map').setView([42.3601, -71.0589], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(map); 
    // not sure this works

  }

  function refreshBuildings() {
    // clear existing
    Object.values(markerLookup).forEach(marker => map.removeLayer(marker));
    Object.keys(markerLookup).forEach(key => delete markerLookup[key]);
    
    // add current buildings
    BuildingManager.getAll().forEach(building => {
      addBuildingToMap(building);
    });
  }

  function addBuildingToMap(building) {
    const marker = L.marker([building.lat, building.lng], {
      icon: createZoneIcon(building.zone)
    }).addTo(map);
    
    marker.zone = building.zone;
    markerLookup[building.name] = marker;
    
    marker.bindPopup(createPopupContent(building.name, building.zone));
    setupMarkerEvents(marker, building.name);
  }

  function createZoneIcon(zone) {
    const color = ZONE[zone] || '#999';
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

  function createPopupContent(name, zone) {
    return `
      <b class="editable-name">${name}</b><br>
      Zone: <span class="zone-label">${zone || 'none'}</span><br>
      <div class="building-actions" style="margin-top:10px;${editMode ? '' : 'display:none;'}">
        <button class="edit-name-btn">Edit Name</button>
        <button class="delete-building-btn">Delete</button>
        <div class="zone-options" style="margin-top:8px;">
          <button data-zone="residential">Residential</button>
          <button data-zone="commercial">Commercial</button>
          <button data-zone="industrial">Industrial</button>
        </div>
      </div>
    `;
  }

  function setupMarkerEvents(marker, buildingName) {
    marker.on('popupopen', () => {
      const popup = marker.getPopup();
      const element = popup.getElement();
      if (!element) return;

      const editBtn = element.querySelector('.edit-name-btn');
      const deleteBtn = element.querySelector('.delete-building-btn');

      editBtn?.addEventListener('click', () => {
        const newName = prompt('Enter new name:', buildingName)?.trim();
        if (!newName) return;
        BuildingManager.update(buildingName, { name: newName });
        refreshBuildings();
      });

      deleteBtn?.addEventListener('click', () => {
        if (!confirm(`Delete ${buildingName}?`)) return;
        BuildingManager.remove(buildingName);
        refreshBuildings();
      });

      element.querySelectorAll('.zone-options button').forEach(btn => {
        btn.addEventListener('click', () => {
          const zone = btn.dataset.zone;
          if (!zone) return;
          BuildingManager.update(buildingName, { zone });
          refreshBuildings();
          popup.setContent(createPopupContent(buildingName, zone));
        });
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

        BuildingManager.getAll().forEach(building => {
          const marker = markerLookup[building.name];
          if (!marker) return;
          
          const shouldShow = !building.zone || visibleZones.includes(building.zone);
          
          if (shouldShow) {
            if (!map.hasLayer(marker))  map.addLayer(marker);
          } else {
            if (map.hasLayer(marker))  map.removeLayer(marker);
          } 
        });
      });
      // update early
      cb.dispatchEvent(new Event('change'));
    });
  }

  function setupEditMode() {
    const btn = document.getElementById('editModeToggle');
  const mapContainer = document.getElementById('map');
  
  btn.addEventListener('click', () => {
    editMode = !editMode;
    btn.textContent = editMode ? 'Disable Edit Mode' : 'Enable Edit Mode';
    mapContainer.classList.toggle('edit-mode', editMode);
    
    // cursor style
    mapContainer.style.cursor = editMode ? 'crosshair' : '';
    
    if (editMode) {
      // brighten colors to show ur editing
      ZONE.residential = '#33ffb4ff';
      ZONE.commercial = '#8a7fff';
      ZONE.industrial = '#ff5252';
      
      // click handler
      setupAddBuildingOnClick();
    } else {
      Object.assign(ZONE, originalColors);
      cleanupTempItems();
      map.off('click'); // we dont need this
    }
    
    refreshBuildings();
  });
}

  function setupBuildingControls() {
    document.getElementById('addBuildingBtn').addEventListener('click', () => {
      if (editMode) {
        alert('Click on the map where you want to add a new building');
        map.once('click', (e) => {
          const name = prompt("Enter building name...")?.trim();
          if (!name) return; // no ghost buildings
        });
      }
    });

    document.getElementById('resetBuildingsBtn').addEventListener('click', () => {
      if (confirm('Reset all buildings to default?')) {
        BuildingManager.reset();
        refreshBuildings();
      }
    });
  }

  function setupAddBuildingOnClick() {
  map.on('click', (e) => {
    if (!editMode) return;
    
    // clean up temp markers
    cleanupTempItems();
    
    // create temp marker
    tempMarker = L.marker(e.latlng, {
      icon: createZoneIcon(selectedNewBuild),
      zIndexOffset: 1000,
      draggable: true
    }).addTo(map);
    
    // create build popup
    addBuildingPopup = L.popup()
      .setLatLng(e.latlng)
      .setContent(createBuildPop())
      .openOn(map);
    
    //  popup events
    setTimeout(() => {
      const popupEl = addBuildingPopup.getElement();
      
      // zone selection
      popupEl.querySelectorAll('.zone-options button').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedNewBuild = btn.dataset.zone;
          tempMarker.setIcon(createZoneIcon(selectedNewBuild));
          // update active state
          popupEl.querySelectorAll('.zone-options button').forEach(b => 
            b.classList.remove('active')
          );
          btn.classList.add('active');
        });
      });
      
      // confirm button just in case
      popupEl.querySelector('#confirmAddBuilding').addEventListener('click', () => {
        const nameInput = popupEl.querySelector('#newBuildingName');
        const name = nameInput.value.trim();
        
        if (name) {
          const newBuilding = {
            name: name,
            lat: tempMarker.getLatLng().lat,
            lng: tempMarker.getLatLng().lng,
            zone: selectedNewBuild
          };
          
          if (BuildingManager.add(newBuilding)) {
            refreshBuildings();
          } else {
            alert('A building already has this name.');
            return;
          }
        } else {
          alert('Please enter building name.');
          return;
        }
        
        cleanupTempItems();
      });
      
      // Cancel button
      popupEl.querySelector('#cancelAddBuilding').addEventListener('click', cleanupTempItems);
    }, 50);
  });
}

function createBuildPop() {
  return `
    <div class="building-creation">
      <h4>New Building</h4>
      <input type="text" id="newBuildingName" placeholder="Building name" class="building-input">
      <div class="zone-options">
        <button data-zone="residential" class="active">Residential</button>
        <button data-zone="commercial">Commercial</button>
        <button data-zone="industrial">Industrial</button>
      </div>
      <div class="form-actions">
        <button id="confirmAddBuilding" class="confirm-btn">Create Building</button>
        <button id="cancelAddBuilding" class="cancel-btn">Cancel</button>
      </div>
    </div>
  `;
}

function cleanupTempItems() {
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
  if (addBuildingPopup) {
    map.closePopup(addBuildingPopup);
    addBuildingPopup = null;
  }
}

  // expose public methods
  return {
    init
  };
})();

// initializer andy
document.addEventListener('DOMContentLoaded', MapManager.init);
