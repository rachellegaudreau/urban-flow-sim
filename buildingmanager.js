// Building Manager
const BuildingManager = (function() {
  // private variables
  const _originalBuildings = [
    { name: 'Diamond City', lat: 42.3467, lng: -71.0972, zone: "commercial" },
    { name: 'Goodneighbor', lat: 42.3554, lng: -71.0605, zone: "residential" },
    { name: 'Bunker Hill', lat: 42.3762, lng: -71.0611, zone: "industrial" },
    { name: 'The Castle', lat: 42.3351, lng: -71.0327, zone: "residential" },
    { name: 'USS Constitution', lat: 42.3744, lng: -71.0494, zone: "residential" }
  ];

  let _buildings = JSON.parse(JSON.stringify(_originalBuildings)); // Deep copy

  // public API
  return {
    getAll: () => _buildings,
    getByName: (name) => _buildings.find(b => b.name === name), // searches for right building
    add: (building) => { 
      if (!_buildings.some(b => b.name === building.name)) { // make sure not same name
        _buildings.push(building);
        return true;
      }
      return false;
    },
    update: (oldName, newData) => {
      const index = _buildings.findIndex(b => b.name === oldName);
      if (index >= 0) {
        // preserve position if not being changed
        if (!newData.lat || !newData.lng) {
          newData.lat = _buildings[index].lat;
          newData.lng = _buildings[index].lng;
        }
        _buildings[index] = { ..._buildings[index], ...newData };
        return true;
      }
      return false; // if building with same name isnt found
    },
    remove: (name) => {
      const index = _buildings.findIndex(b => b.name === name);
      if (index >= 0) {
        _buildings.splice(index, 1);
        return true;
      }
      return false;
    },
    reset: () => {
      _buildings = JSON.parse(JSON.stringify(_originalBuildings)); // deep copy 
      // maybe try undo function
    },
    getZones: () => {
      return [...new Set(_buildings.map(b => b.zone).filter(Boolean))]; // gets rid of the empty
    }
  };
})();
