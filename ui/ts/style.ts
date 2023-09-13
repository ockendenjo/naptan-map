import {Fill, RegularShape, Stroke, Style} from "ol/style";

export const markerStyle = new Style({
    image: new RegularShape({
        radius: 10,
        points: 4,
        angle: Math.PI / 4,
        fill: new Fill({color: "purple"}),
        stroke: new Stroke({
            color: "white",
            width: 2,
        }),
    }),
});
