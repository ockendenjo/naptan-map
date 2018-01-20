$(document).ready(function(){
    "use strict";
    var map;

	//Popup
	var popupelem = document.getElementById("popup");
	var closer = document.getElementById('popup-closer');

	var overlay = new ol.Overlay({
        element: popupelem,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      });

	closer.onclick = function(){
		overlay.setPosition(undefined);
        closer.blur();
    };

    var raster = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    var vectorSource = new ol.source.Vector({wrapX: false});

    var stopsLayer = new ol.layer.Vector({
        source: vectorSource,
        opacity: 0.5
    });

	var hillMarker = new ol.style.Style({
        image: new ol.style.RegularShape({
            radius: 10,
            points: 4,
            snapToPixel: false,
            angle: (Math.PI / 4),
            fill: new ol.style.Fill({color: 'purple'}),
            stroke: new ol.style.Stroke({
                color: 'white', width: 2
            })
        })
	});

	var mapView = new ol.View({maxZoom: 19});
    mapView.setZoom(10);
    mapView.setCenter(ol.proj.fromLonLat([-2.9800,54.4804]));

    function initialiseMap(){
        map = new ol.Map({
            target: 'map',
            layers: [raster,stopsLayer],
            overlays: [overlay],
            view: mapView
        });

        map.on("click",function(e){
            var icon = map.forEachFeatureAtPixel(e.pixel,function(feature)
            {
                return feature;
            });
            if(icon === undefined){
                return;
            }
            var properties = icon.getProperties();
            var stop = properties.stop;
            console.log(stop);
            showPopup(e,stop);
        });
    }

    function showPopup(event,stop)
    {
        $("#stop-name").text(stop.name);
        $("#stop-atco").text(stop["naptan:AtcoCode"]);
        $("#stop-bear").text(stop["naptan:Bearing"]);
        $("#stop-common").text(stop["naptan:CommonName"]);
        $("#stop-ind").text(stop["naptan:Indicator"]);
        $("#stop-landmark").text(stop["naptan:Landmark"]);
        $("#stop-locality").text(stop["naptan:LocalityCode"]);
        $("#stop-naptan").text(stop["naptan:NaptanCode"]);
        $("#stop-street").text(stop["naptan:Street"]);
        $("#stop-ref").text(stop.ref);
        $("#stop-status").text(stop.status);

        console.log(event.coordinate);
        overlay.setPosition(event.coordinate);

        $("#import").off();
        $("#import").click(function(){

            var tags = "";
            Object.keys(stop).forEach(function(k,i){
                if(k === "lat" || k === "lon" || k === "status"){
                    return;
                }
                var v = stop[k];
                if(tags.length > 0){
                    tags = tags + "|";
                }
                tags = tags + k + "=" + v;
            });

            var urldata = {};
            urldata.lat = stop.lat;
            urldata.lon = stop.lon;
            urldata.addtags = tags;
            var uri = "https://localhost:8112/add_node";
            $.get(uri,urldata);
            closer.onclick();
        });
    }

    function loadStops(){
        $.get("data.csv").done(function(data,text,xhr){
            
            var stops = data.split("\r");
            stops = stops.map(formatStop);
            stops = stops.filter(function(s){
                return s.status === "act";
            });

            stops.forEach(function(stop){

                if(stop.lon === undefined || stop.lat === undefined){
                        return;
                }
                
                var iconFeature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(stop.lon),parseFloat(stop.lat)])),
                    stop: stop
                });

                iconFeature.setStyle(hillMarker);
                vectorSource.addFeature(iconFeature);
            });

            var extent = vectorSource.getExtent();
            
            mapView.fit(extent);
        });
    }
    
    function formatStop(stop)
    {
        var line = stop.replace("\n","");
        line = line.split('"').join('');
        var cols = line.split(',');
        var data = {};
        data.highway = "bus_stop";
        data["naptan:verified"] = "no";
        data["naptan:AtcoCode"] = cols[0];
        data["naptan:NaptanCode"] = cols[1];
        data["naptan:Landmark"] = cols[8];
        data.ref = cols[1];
        data["naptan:CommonName"] = cols[4];
        data.name = cols[4];
        data["naptan:Street"] = cols[10];
        data["naptan:Indicator"] = cols[14];
        data["naptan:Bearing"] = cols[16];
        data["naptan:LocalityCode"] = cols[17];
        data.lon = cols[29];
        data.lat = cols[30];
        data.status = cols[42];
        return data;
    }
    

    function load(){
        initialiseMap();
        loadStops();
    }

    load();
});
