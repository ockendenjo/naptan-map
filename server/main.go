package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"
)

const (
	port = 8080
)

func main() {
	fs := http.FileServer(http.Dir("./ui"))
	http.Handle("/", fs)

	fmt.Printf("started server http://localhost:%d\n", port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
