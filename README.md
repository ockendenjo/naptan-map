# Naptan Map
OpenLayers webpage which displays data from a naptan CSV file and allows easy import into JOSM

## Setup
* Download the Naptan data set from https://data.gov.uk/dataset/naptan in zipped CSV format
* Extract relevant data from the `Stops.csv` file
* `awk -F '","'  'BEGIN {OFS=","} { if (tolower($22) == "lancaster")  print }' Stops.csv > data.csv`
* Place `data.csv` in the same directory as `index.html`

```shell
# Usage main.go <pathToStopsCSVFile>
go run server/main.go ui/data.csv
```

## OpenLayers
`ol.css` and `ol.js` are OpenLayers files

OpenLayers is licenced under a 2-clause BSD License

https://github.com/openlayers/openlayers
