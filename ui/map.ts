import "./map.css";
import {Feature, Map as OLMap, MapBrowserEvent, Overlay, View} from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {fromLonLat, toLonLat} from "ol/proj";
import {defaults as defaultControls, ScaleLine} from "ol/control";
import {getStopTags, Stop, StopAPIResponse} from "./ts/stop";
import {Point} from "ol/geom";
import {markerStyle} from "./ts/style";

document.addEventListener("DOMContentLoaded", () => {
    const osmLayer = new TileLayer({source: new OSM(), opacity: 0.8});

    /**
     * Elements that make up the popup.
     */
    const container = document.getElementById("popup");
    const closer = document.getElementById("popup-closer");

    /**
     * Create an overlay to anchor the popup to the map.
     */
    const overlay = new Overlay({
        element: container,
        autoPan: {
            animation: {
                duration: 250,
            },
        },
    });

    /**
     * Add a click handler to hide the popup.
     * @return {boolean} Don't follow the href.
     */
    closer.onclick = () => {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };

    const vectorSource = new VectorSource({wrapX: false});
    const stopsLayer = new VectorLayer({
        source: vectorSource,
        opacity: 0.5,
    });

    const mapView = new View({maxZoom: 19});
    mapView.setZoom(10);
    mapView.setCenter(fromLonLat([-3.18905, 55.95327]));

    function initialiseMap() {
        const map = new OLMap({
            controls: defaultControls().extend([new ScaleLine()]),
            target: "map",
            layers: [osmLayer, stopsLayer],
            keyboardEventTarget: document,
            view: mapView,
            overlays: [overlay],
        });

        map.on("click", function (e) {
            const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f);
            if (!feature) {
                overlay.setPosition(undefined);
                return;
            }
            const properties = feature.getProperties();
            const stop = properties.stop as Stop;
            showPopup(e, stop);
        });

        map.on("moveend", (e) => {
            const zoom = mapView.getZoom();
            if (zoom >= 15) {
                loadStopsHere();
            }
        });
    }

    function showPopup(event: MapBrowserEvent<any>, stop: Stop) {
        document.getElementById("stop-name").textContent = stop.CommonName;
        document.getElementById("stop-atco").textContent = stop.ATCOCode;
        document.getElementById("stop-bear").textContent = stop.Bearing;
        document.getElementById("stop-ind").textContent = stop.Indicator;
        document.getElementById("stop-landmark").textContent = stop.Landmark;
        document.getElementById("stop-naptan").textContent = stop.NaptanCode;
        document.getElementById("stop-street").textContent = stop.Street;
        document.getElementById("stop-status").textContent = stop.Status;
        overlay.setPosition(event.coordinate);

        document.getElementById("import").onclick = () => {
            const tags = getStopTags(stop);
            const tagStr = Object.entries(tags)
                .map(([k, v]) => {
                    return `${k}=${v}`;
                })
                .join("|");

            const params = new URLSearchParams({
                lat: String(stop.Latitude),
                lon: String(stop.Longitude),
                addtags: tagStr,
            });

            const url = "add_node?" + params.toString();
            fetch(url);
        };
    }

    function loadStopsHere() {
        const center = toLonLat(mapView.getCenter());
        loadStops(center[1], center[0]);
    }

    const loadedStops: Map<string, Stop> = new Map();

    function loadStops(lat: number, lon: number) {
        let url = `http://localhost:8080/api/stops?lat=${lat}&lon=${lon}`;
        fetch(url)
            .then((r) => r.json())
            .then((j: StopAPIResponse) => j.stops)
            .then((stops) => {
                stops.forEach((s) => {
                    if (!loadedStops.has(s.ATCOCode)) {
                        addStop(s);
                    }
                });
            });
    }

    function addStop(s: Stop) {
        const feature = new Feature({
            geometry: new Point(fromLonLat([s.Longitude, s.Latitude])),
            stop: s,
        });
        feature.setStyle(markerStyle);
        vectorSource.addFeature(feature);

        loadedStops.set(s.ATCOCode, s);
    }

    initialiseMap();
});
