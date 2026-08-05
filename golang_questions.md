# Golang Questions

Create a function that counts the word frequency in this string "Four, One two two three Three three four  four   four".  Case insensitive, ignore punctuation.  
Expected Answer (order doesn’t matter):  
one => 1  
two => 2  
three => 3  
four => 4  

---
Answer:

```golang
package main

import (
 "fmt"     // Implements formatted I/O functions like Printf
 "strings" // Provides utility functions for string manipulation (FieldsFunc, ToLower)
 "unicode" // Provides functions to inspect Unicode character properties (IsLetter, IsNumber)
)

// WordCount processes an input string and returns a map where keys are unique lowercase words (string)
// and values are their occurrence frequencies (int).
func WordCount(s string) map[string]int {
 // Value of 's': "Four, One two two three Three three four  four   four"

 // Initializes an empty, ready-to-use map to store word counts.
 // Value of 'results': map[] (empty map)
 results := make(map[string]int)

 // Splits string 's' into a slice of substrings whenever the callback function returns true.
 // The callback checks each character 'r' (as a rune): if 'r' is NOT a letter and NOT a number,
 // it acts as a separator (punctuation/spaces are stripped out).
 // Value of 'words': []string{"Four", "One", "two", "two", "three", "Three", "three", "four", "four", "four"}
 words := strings.FieldsFunc(s, func(r rune) bool {
  return !unicode.IsLetter(r) && !unicode.IsNumber(r)
 })

 // Iterates through each element in the 'words' slice.
 // '_' ignores the slice index. 'word' holds the current element string for each iteration.
 for _, word := range words {
  // strings.ToLower(word) converts the current word to lowercase.
  // results[...]++ increments the count for that key in the map by 1 (defaults to 0 if key is new).
  results[strings.ToLower(word)]++
 }

 // Returns the completed frequency map back to the caller.
 // Value returned: map["four":4, "one":1, "three":3, "two":2]
 return results
}

func main() {
 // Defines the raw test string containing mixed casing, punctuation (comma), and irregular spacing.
 // Value of 'input': "Four, One two two three Three three four  four   four"
 input := "Four, One two two three Three three four  four   four"

 // Calls WordCount with 'input' and assigns the returned map to local variable 'results'.
 // Value of 'results': map["four":4, "one":1, "three":3, "two":2]
 results := WordCount(input)

 // Loops through the key-value pairs in 'results'.
 // Note: Map iteration order in Go is randomized and unpredictable.
 // Across loop passes:
 // - 'word' takes values: "one", "two", "three", "four" (in non-deterministic order)
 // - 'count' takes corresponding map values: 1, 2, 3, 4
 for word, count := range results {
  // Prints formatted string replacing %s with 'word' and %d with 'count', followed by newline.
  // Output lines printed (order varies):
  //   one => 1
  //   two => 2
  //   three => 3
  //   four => 4
  fmt.Printf("%s => %d\n", word, count)
 }
}
```
