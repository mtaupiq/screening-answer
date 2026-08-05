# Javascript/Typescript Questions

## Level 1

Make a javascript or typescript function that converts any string to Title Case.

---

Answer:

```typescript
function titleCase(str: String): String {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const testCases = [
  "I'm a little tea pot",
  "sHoRt AnD sToUt",
  "SHORT AND STOUT"
];

testCases.forEach(input => {
  console.log(`Input:  ${input}`);
  console.log(`Output: ${titleCase(input)}`);
  console.log('---');
});
```

---

Create a function that counts the word frequency in this string "Four One two two three Three three four  four   four".  Case insensitive, ignore punctuation.  
Expected Answer:  
one => 1  
two => 2  
three => 3  
four => 4

---

Answer:

```typescript
function countWordFrequency(str: string): Record<string, number> {
  // Normalize string: lowercased, remove punctuation, split by whitespace
  const words: string[] = str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/);

  const frequency: Record<string, number> = {};

  for (const word of words) {
    if (word) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  }

  return frequency;
}

const input: string = "Four One two two three Three three four  four   four";
const result: Record<string, number> = countWordFrequency(input);
const sortedEntries = Object.entries(result).sort((a, b) => a[1] - b[1]);
sortedEntries.forEach(([word, count]) => {
  console.log(`${word} => ${count}`);
});
```

## Level 2

Fix this code, using promises:

```javascript
function delay(ms) {
  // add promise code here
}

delay(3000).then(() => alert('runs after 3 seconds'));
```

---

Answer:

```typescript
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

delay(3000).then(() => alert('runs after 3 seconds'));
```

## Level 2.5

Rewrite using async/await:

```javascript
function fetchData(url, callback) {
  setTimeout(() => {
    if (!url) {
      callback("URL is required", null);
    } else {
      callback(null, `Data from ${url}`);
    }
  }, 1000);
}


function processData(data, callback) {
  setTimeout(() => {
    if (!data) {
      callback("Data is required", null);
    } else {
      callback(null, data.toUpperCase());
    }
  }, 1000);
}

// Using callbacks
fetchData("https://example.com", (err, data) => {
  if (err) {
    console.error("Fetch Error:", err);
  } else {
    processData(data, (err, processedData) => {
      if (err) {
        console.error("Process Error:", err);
      } else {
        console.log("Processed Data:", processedData);
      }
    });
  }
});
```

---
Answer:

```typescript
function fetchData(url?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!url) {
        reject("URL is required");
      } else {
        resolve(`Data from ${url}`);
      }
    }, 1000);
  });
}

function processData(data?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data) {
        reject("Data is required");
      } else {
        resolve(data.toUpperCase());
      }
    }, 1000);
  });
}

// Using async/await
async function run(): Promise<void> {
  try {
    const data = await fetchData("https://example.com");
    const processedData = await processData(data);
    console.log("Processed Data:", processedData);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
```

## Level 3-4

Create a real-time chat between two windows; using web sockets, vuejs and typescript.

* Deployed apps: [Chat App](https://ec2-52-64-146-94.ap-southeast-2.compute.amazonaws.com)
* Run locally: [README](chat-app/README.md)
