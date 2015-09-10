var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

var map = new ol.Map({
  controls: [],
  interactions : ol.interaction.defaults({
    doubleClickZoom: false,
    dragZoom: false,
    keyboardZoom: false,
    mouseWheelZoom: false,
    pinchZoom: false,
  }),
  target: 'map',
  renderer: 'canvas', // Force the renderer to be used
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    })
  ],
  view: new ol.View({
    center: ol.proj.transform([-122.3020636,37.8732388], 'EPSG:4326', 'EPSG:3857'),
    zoom: 18
  })
});

// Create an image layer
var FUDGE = 0.0005;
var OFFSETX = 0.0001;
var OFFSETY = -0.0002;

function base64Encode(str) {
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var out = "", i = 0, len = str.length, c1, c2, c3;
  while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
      }
      c2 = str.charCodeAt(i++);
      if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
          out += CHARS.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
      }
      c3 = str.charCodeAt(i++);
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += CHARS.charAt(c3 & 0x3F);
  }
  return out;
}

function addImage(lat, lon, src) {
  var imageLayer = new ol.layer.Image({
    // opacity: 0.75,
    source: new ol.source.ImageStatic({
      attributions: [
      ],
      url: src,
      // imageSize: [691, 541],
      projection: map.getView().getProjection(),
      imageExtent: ol.extent.applyTransform([lon-OFFSETX, lat-OFFSETY, lon-OFFSETX - FUDGE, lat-OFFSETY - FUDGE], ol.proj.getTransform("EPSG:4326", "EPSG:3857"))
    })
  });

  map.addLayer(imageLayer);
}

$('#take_photo').on('click', function () {
  addImage(globmsg.lat, globmsg.lon, '/api/photo?' + Date.now())
})
// setTimeout(addImage, 000, 37.8732388, -122.3028985, '/static/images/example.jpg');

var iconFeature = new ol.Feature({
  geometry: new ol.geom.Point(ol.proj.transform([-122.3020636, 37.8732388], 'EPSG:4326', 'EPSG:3857')),
  name: 'Solo',
});

iconFeature.setStyle(new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 1,
    src: 'static/images/solo.png',
    scale: .15,
  }))
}));

var vectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [ iconFeature ]
  }),
});

map.addLayer(vectorLayer)

map.on('dblclick', function(evt) {
  var coord = transform(evt.coordinate);
  $.ajax({
    method: 'PUT',
    url: '/api/location',
    contentType : 'application/json',
    data: JSON.stringify({ lat: coord[1], lon: coord[0] }),
  })
  .done(function( msg ) {
    console.log('sent data')
  });
});

var globmsg = {};

var source = new EventSource('/api/sse/location');
source.onmessage = function (event) {
  var msg = JSON.parse(event.data);
  globmsg = msg;
  console.log(msg);
  iconFeature.setGeometry(new ol.geom.Point(ol.proj.transform([msg.lon, msg.lat], 'EPSG:4326',     
'EPSG:3857')));
};
