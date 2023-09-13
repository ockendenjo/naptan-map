export type Stop = {
    ATCOCode: string;
    Bearing: string;
    CommonName: string;
    Indicator: string;
    Landmark: string;
    NaptanCode: string;
    Street: string;
    Status: string;
    Longitude: number;
    Latitude: number;
};

export type StopAPIResponse = {
    stops: Stop[];
};

export function getStopTags(s: Stop): Record<string, string> {
    const tags = {
        "naptan:AtcoCode": s.ATCOCode,
        "naptan:Bearing": s.Bearing,
        "naptan:CommonName": s.CommonName,
        name: s.CommonName,
        "naptan:Indicator": s.Indicator,
        "naptan:Landmark": s.Landmark,
        "naptan:NaptanCode": s.NaptanCode,
        "naptan:Street": s.Street,
        highway: "bus_stop",
        public_transport: "platform",
        bus: "yes",
    };

    Object.keys(tags).forEach((k) => {
        const v = tags[k];
        if (!v) {
            delete tags[k];
        }
    });
    return tags;
}
