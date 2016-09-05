# node-zstandard
Node.js interface to Zstandard (zstd)

Includes Zstd 1.0.0 version for Linux (x86-64, glibc >=2.19), Windows (32 and 64 bits), and Mac OS X (Darwin).

## Interface

`var zstd = require ('node-zstandard')`

### Compression

#### zstd.compress (inputFile, outputFile [, compLevel], callback)
#### zstd.compressFileToFile (inputFile, outputFile [, compLevel], callback)

* `inputFile`: Path to the to file to be compressed.
* `outputFile`: Path to store the resulting compressed file. 
* `compLevel`: Compression level (default=3).
* `callback`: Function to be executed on task completion. Follows Node.js `(err, result)` pattern, being `result` equal to `outputFile` when succedded.

NOTE: Input and output files should be different. Output file is overwritten if it exists.

```
zstd.compress('./test', './test.zst', 3, (err, result) => {
  if (err)
    throw err;
  console.log (result);
});
```

#### compressStreamToFile (readableStream, outputFile [, compLevel], callback)

* `readableStream`: Data Node.js Stream to be compressed.
* `outputFile`: Path to store the resulting compressed file. 
* `compLevel`: Compression level (default=3).
* `callback`: Function to be executed on task initialization. Follows Node.js `(err, result)` pattern, being `result` an EventEmitter that can emit the following events:
  * `error`: Emitted when an error reading the stream or creating the compressed file occurred. Error message is provided.
  * `end`: Emitted when task ended successfully.

NOTE: Output file is overwritten if it exists.

```
zstd.compressStreamToFile(aReadableStream, './test.zst', 3, (err, result) => {
  if (err)
    throw err;
  result.on('error', (err) => {
    throw err;
  }
  result.on('end', () => {
    console.log ('Compression ended');
  }
  console.log ('Compression started');
});
```

### Decompression

#### zstd.decompress (inputFile, outputFile, callback)
#### zstd.decompressFileToFile (inputFile, outputFile, callback)

* `inputFile`: Path to the to compressed input file.
* `outputFile`: Path to store the resulting decompressed file. 
* `callback`: Function to be executed on task completion. Follows Node.js `(err, result)` pattern, being `result` equal to `outputFile` when succedded.

NOTE: Input and output files should be different. Output file is overwritten if it exists.

```
zstd.decompress('./test.zst','./test', (err, result) => {
  if (err)
    throw err;
  console.log (result);
});
```

#### decompressFileToStream (inputFile, writableStream, callback)

* `inputFile`: Path to the to compressed input file.
* `writableStream`: Node.js Stream where to output decompressed data.
* `callback`: Function to be executed on task initialization. Follows Node.js `(err, result)` pattern, being `result` an EventEmitter that can emit the following events:
  * `error`: Emitted when an error involving streams or file decompression occurred. Error message is provided.
  * `finish`: Emitted when finished writting decompressed data to output stream.

```
zstd.decompressFileToStream ('./test', aWritableStream, (err, result) => {
  if (err)
    throw err;
  result.on('error', (err) => {
    throw err;
  }
  result.on('finish', () => {
    console.log ('Decompression finished');
  }
  console.log ('Decompression started');
});
```

#### decompressionStreamFromFile (inputFile, callback)

* `inputFile`: Path to the to compressed input file.
* `callback`: Function to be executed on task initialization. Follows Node.js `(err, result)` pattern, being `result` an EventEmitter that can emit the following events:
  * `error`: Emitted when an error involving streams or file decompression occurred. Error message is provided.
  * `data`: Emitted when a chunk of decompressed data is generated. Data is obviously provided.
  * `end`: Emitted when decompression ended and all data events have been emitted.

```
zstd.decompressionStreamFromFile ('./test', (err, result) => {
  if (err)
    throw err;
  var decompressedData = '';
  result.on('error', (err) => {
    throw err;
  }
  result.on('data', (data) => {
    decompressedData += data;
  }
  result.on('end', () => {
    console.log (decompressedData);
  }
});
```

## License
Apache 2.0
