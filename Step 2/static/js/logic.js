console.log("Step 2 working");


// We create the tile layer that will be the background of our map.
let basemap = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'",
  {
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  });

// We then create the map object with options.
let map = L.map("map", {
  center: [
    40.7, -94.5
  ],
  zoom: 3,
});

// Adding our 'basemap' tile layer to the map.
basemap.addTo(map);

// We create the layers for our two different sets of data, earthquakes and
// tectonicplates.
let tectonicplates = new L.LayerGroup();
let earthquakes = new L.LayerGroup();

// Defining an object that contains our map for use in the layer control.
let baseMaps = {
  "Global Earthquakes": basemap,
};

// We define an object that contains all of our overlays. Any combination of
// these overlays may be visible at the same time!
let overlays = {
  "Tectonic Plates": tectonicplates,
  Earthquakes: earthquakes
};

// Then we add a control to the map that will allow the user to change which
// layers are visible.
L
  .control
  .layers(baseMaps, overlays)
  .addTo(map);

// Our AJAX call retrieves our earthquake geoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

  // This function returns the style data for each of the earthquakes we plot on
  // the map. We pass the magnitude of the earthquake into two separate functions
  // to calculate the color and radius.
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 1,
      fillColor: getColor(feature.geometry.coordinates[2]),
      color: "#000000",
      radius: getRadius(feature.properties.mag),
      stroke: true,
      weight: 0.5
    };
  }

  // This function determines the color of the marker based on the magnitude of the earthquake.
  function getColor(depth) {
    switch (true) {
      case depth > 90:
        return "#ea2c2c";
      case depth > 70:
        return "#ea822c";
      case depth > 50:
        return "#ee9c00";
      case depth > 30:
        return "#eecc00";
      case depth > 10:
        return "#d4ee00";
      default:
        return "#98ee00";
    }
  }

  // This function determines the radius of the earthquake marker based on its magnitude.
  // Earthquakes with a magnitude of 0 were being plotted with the wrong radius.
  function getRadius(magnitude) {
    if (magnitude === 0) {
      return 1;
    }

    return magnitude * 4;
  }

  // Here we add a GeoJSON layer to the map once the file is loaded.
  L.geoJson(data, {
    // We turn each feature into a circleMarker on the map.
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    // We set the style for each circleMarker using our styleInfo function.
    style: styleInfo,
    // We create a popup for each marker to display the magnitude and location of
    // the earthquake after the marker has been created and styled
    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        "Magnitude: "
        + feature.properties.mag
        + "<br>Depth: "
        + feature.geometry.coordinates[2]
        + "<br>Location: "
        + feature.properties.place
      );
    }
    // We add the data to the earthquake layer instead of directly to the map.
  }).addTo(earthquakes);

  // Then we add the earthquake layer to our map.
  earthquakes.addTo(map);

  // Here we create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    let grades = [-10, 10, 30, 50, 70, 90];
    let colors = [
      "#98ee00",
      "#d4ee00",
      "#eecc00",
      "#ee9c00",
      "#ea822c",
      "#ea2c2c"];

    // Loop through our intervals and generate a label with a colored square for each interval.
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML += "<i style='background: "
        + colors[i]
        + "'></i> "
        + grades[i]
        + (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
    }
    return div;
  };

  // We add our legend to the map.
  legend.addTo(map);

  // Here we make an AJAX call to get our Tectonic Plate geoJSON data.
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (platedata) {
    // Adding our geoJSON data, along with style information, to the tectonicplates
    // layer.
    L.geoJson(platedata, {
      color: "orange",
      weight: 2
    })
      .addTo(tectonicplates);

    // Then add the tectonicplates layer to the map.
    tectonicplates.addTo(map);
  });
});

