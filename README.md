# node-zstandard
Node.js interface to Zstandard (zstd)

Includes Zstd 0.7.4 version for Linux (x86-64, glibc >=2.19) and Zstd 0.7.3 version for Windows.

## Interface

`var zstd = require ('node-zstandard')`

### zstd.compress (inputFile, outputFile [, compLevel], callback)

* `inputFile`: Path to the to file to be compressed.
* `outputFile`: Path to store the resulting compressed file. 
* `compLevel`: Compression level (default=3).
* `callback`: Function to be executed on task completion. Follows Node.js `(err, result)` pattern, being `result` equal to `outputFile` when succedded.

NOTE: Input and output files should be different. Output file is overwritten if it exists.

```
zstd.compress('./test','./test.zst', 3, (err, value) => {
  if (err)
    throw err;
  console.log (value);
});
```

### zstd.decompress (inputFile, outputFile, callback)

* `inputFile`: Path to the to compressed input file.
* `outputFile`: Path to store the resulting decompressed file. 
* `callback`: Function to be executed on task completion. Follows Node.js `(err, result)` pattern, being `result` equal to `outputFile` when succedded.

NOTE: Input and output files should be different. Output file is overwritten if it exists.

```
zstd.decompress('./test.zst','./test', (err, value) => {
  if (err)
    throw err;
  console.log (value);
});
```
## License
Apache 2.0
