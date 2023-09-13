package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"strconv"
)

const (
	port = 8080
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: main.go <pathToStopsFiles>")
	}
	csvFile := os.Args[1]
	fmt.Printf("reading CSV file\n")

	fs := http.FileServer(http.Dir("./ui/dist"))
	http.Handle("/", fs)
	apiHandler, err := setupApiHandler(csvFile)
	if err != nil {
		log.Fatal(err)
	}
	http.HandleFunc("/api/stops", apiHandler)

	fmt.Printf("started server http://localhost:%d\n", port)
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}

func setupApiHandler(csvFile string) (func(http.ResponseWriter, *http.Request), error) {
	records, err := readRows(csvFile)
	if err != nil {
		return nil, err
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		lat, lon, err := getLatLon(request.RequestURI)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			return
		}

		diff := 0.005
		maxLat := lat + diff
		minLat := lat - diff
		minLon := lon - diff
		maxLon := lon + diff

		filtered := []NaptanRecord{}
		for _, record := range records {
			if record.Latitude < maxLat && record.Latitude > minLat && record.Longitude < maxLon && record.Longitude > minLon {
				filtered = append(filtered, record)
			}
		}
		output := ApiResponse{Stops: filtered}
		bytes, err := json.Marshal(output)
		if err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}

		writer.Header().Set("Content-Type", "application/json")
		writer.Write(bytes)
	}, nil
}

type ApiResponse struct {
	Stops []NaptanRecord `json:"stops"`
}

func getLatLon(requestURI string) (float64, float64, error) {
	parsed, err := url.Parse(requestURI)
	if err != nil {
		return 0, 0, err
	}

	latStr := parsed.Query().Get("lat")
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return 0, 0, err
	}
	lonStr := parsed.Query().Get("lon")
	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		return 0, 0, err
	}

	return lat, lon, nil
}

func readRows(csvFile string) ([]NaptanRecord, error) {
	file, err := os.Open(csvFile)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	csvReader := csv.NewReader(file)

	records := []NaptanRecord{}

	i := 0
	var transformFn func(read []string)
	chanLen := runtime.NumCPU() * 2
	c := make(chan TransformResult, chanLen)
	remaining := 0

	doRead := func() error {
		result := <-c
		remaining--
		if result.Error != nil {
			return err
		}
		records = append(records, result.NaptanRecord)
		return nil
	}

	for {
		read, err := csvReader.Read()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, err
		}
		if i == 0 {
			transformFn = getTransformFn(read, c)
			i++
			continue
		}

		go transformFn(read)
		remaining++

		if i > chanLen {
			err = doRead()
			if err != nil {
				return nil, err
			}
		}
		i++
	}

	for remaining > 0 {
		err = doRead()
		if err != nil {
			return nil, err
		}
	}

	return records, nil
}

type NaptanRecord struct {
	ATCOCode   string  `json:"ATCOCode"`
	Bearing    string  `json:"Bearing"`
	CommonName string  `json:"CommonName"`
	Indicator  string  `json:"Indicator"`
	Landmark   string  `json:"Landmark"`
	NaptanCode string  `json:"NaptanCode"`
	Street     string  `json:"Street"`
	Status     string  `json:"Status"`
	Longitude  float64 `json:"Longitude"`
	Latitude   float64 `json:"Latitude"`
}

type TransformResult struct {
	NaptanRecord NaptanRecord
	Error        error
}

type transformFn func(read []string)

func getTransformFn(headerRow []string, c chan TransformResult) transformFn {
	headerMap := map[string]int{}
	for i, s := range headerRow {
		headerMap[s] = i
	}
	atcoIndex := headerMap["ATCOCode"]
	bearingIndex := headerMap["Bearing"]
	commonIndex := headerMap["CommonName"]
	indicatorIndex := headerMap["Indicator"]
	landmarkIndex := headerMap["Landmark"]
	naptanIndex := headerMap["NaptanCode"]
	streetIndex := headerMap["Street"]
	statusIndex := headerMap["Status"]
	latIndex := headerMap["Latitude"]
	lonIndex := headerMap["Longitude"]

	return func(read []string) {

		latStr := read[latIndex]
		var lat float64
		var err error
		if latStr != "" {
			lat, err = strconv.ParseFloat(latStr, 64)
			if err != nil {
				c <- TransformResult{NaptanRecord: NaptanRecord{}, Error: err}
				return
			}
		}
		var lon float64
		lonStr := read[lonIndex]
		if lonStr != "" {
			lon, err = strconv.ParseFloat(lonStr, 64)
			if err != nil {
				c <- TransformResult{NaptanRecord: NaptanRecord{}, Error: err}
				return
			}
		}

		record := NaptanRecord{
			ATCOCode:   read[atcoIndex],
			Bearing:    read[bearingIndex],
			CommonName: read[commonIndex],
			Indicator:  read[indicatorIndex],
			Landmark:   read[landmarkIndex],
			NaptanCode: read[naptanIndex],
			Street:     read[streetIndex],
			Status:     read[statusIndex],
			Latitude:   lat,
			Longitude:  lon,
		}
		c <- TransformResult{NaptanRecord: record, Error: nil}
	}
}
