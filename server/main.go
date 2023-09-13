package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
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

	//Serve UI files
	fs := http.FileServer(http.Dir("./ui/dist"))
	http.Handle("/", fs)

	//Stops API
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
