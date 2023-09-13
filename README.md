# NaPTAN Map
OpenLayers webpage which displays data from a NaPTAN CSV file and allows easy import into JOSM

## Setup
* Download the NaPTAN data set (Stops.csv) from https://data.gov.uk/dataset/naptan in zipped CSV format
* Build the UI

```shell
cd ui
npm install
npm run build
```

* Start the server:

```shell
# Usage main.go <pathToStopsCSVFile>
go run server/main.go ~/Downloads/Stops.csv
```

* Open the UI: http://localhost:8080
* Zoom in to view bus stops in the NaPTAN dataset

## OpenLayers

OpenLayers is licenced under a 2-clause BSD License

https://github.com/openlayers/openlayers
