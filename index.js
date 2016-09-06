var cp=require('child_process');
var fs=require('fs');
var path=require('path');
var events=require('events');
var zstdBin=(process.platform === 'win32')?((process.arch === 'x64')?'zstd64.exe':'zstd32.exe'):((process.platform === 'darwin')?'zstd.darwin':'zstd.linux64');
var zstdBinPath=path.resolve(__dirname, 'bin', zstdBin);

function compress(inputFile, outputFile, compLevel, callback){
  var args=[];
  for (var i=0; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  inputFile=path.resolve(args.shift());
  outputFile=path.resolve(args.shift());
  callback=args.pop();
  if(args.length>0) compLevel=args.shift(); else compLevel=3;
  if(inputFile === outputFile){
    if(callback) callback(new Error('Input and output files cannot be the same.'))
    return;
  }
  if(compLevel<1 || compLevel>22)
    compLevel=3;
  fs.access(inputFile, fs.R_OK, (err) => {
    if(err){
      if(callback) callback(new Error('Input file is not readable.'));
      return;
    }
    fs.access(path.dirname(outputFile), fs.W_OK, (err) => {
      if(err){
        if(callback) callback(new Error('Output file is not writable.'));
        return;
      }
      fs.access(zstdBinPath, fs.R_OK | fs.X_OK, (err) => {
        if(err){
          if(callback) callback(new Error('Zstd binary is not executable.'));
          return;
        }
        cp.execFile(zstdBinPath, ['-f', '-'+compLevel, inputFile, '-o', outputFile]
                               , (err, stdout, stderr) => {
          
          if(err){
            if(callback) callback(err);
            return;
          } else if(stdout){
            if(callback) callback(new Error(stdout));
            return;
          }
          if(callback) callback(null, outputFile);
        });
      });
    });
  });
}

function compressStreamToFile(readableStream, outputFile, compLevel, callback){
  var args=[];
  for (var i=0; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  readableStream=args.shift();
  outputFile=path.resolve(args.shift());
  callback=args.pop();
  if(args.length>0) compLevel=args.shift(); else compLevel=3;
  if(compLevel<1 || compLevel>22)
    compLevel=3;
  var eventEmitter = new events.EventEmitter();
  fs.access(path.dirname(outputFile), fs.W_OK, (err) => {
    if(err){
      if(callback) callback(new Error('Output file is not writable.'));
      return;
    }
    fs.access(zstdBinPath, fs.R_OK | fs.X_OK, (err) => {
      if(err){
        if(callback) callback(new Error('Zstd binary is not executable.'));
        return;
      }
      var proc=cp.spawn(zstdBinPath, ['-f', '-o', outputFile]);
      readableStream.pipe(proc.stdin);
      readableStream.on('error', (err) => {
        proc.kill();
        eventEmitter.emit('error', err);
      });
      proc.on('exit', (code, signal) => {
        if(code==0) eventEmitter.emit('end');
        else if(code!=0) eventEmitter.emit('error', new Error('Unexpected stream close. Code '+code+'. Signal '+signal));
        proc.removeAllListeners('error');
      });
      proc.on('error', (err) => {
        eventEmitter.emit('error', err);
        proc.removeAllListeners('exit');
      });
      if(callback) callback(null, eventEmitter);
    });
  });
}

function decompress(inputFile, outputFile, callback){
  inputFile=path.resolve(inputFile);
  outputFile=path.resolve(outputFile);
  if(inputFile === outputFile){
    if(callback) callback(new Error('Input and output files cannot be the same.'))
    return;
  }
  fs.access(inputFile, fs.R_OK, (err) => {
    if(err){
      if(callback) callback(new Error('Input file is not readable.'));
      return;
    }
    fs.access(path.dirname(outputFile), fs.W_OK, (err) => {
      if(err){
        if(callback) callback(new Error('Output file is not writable.'));
        return;
      }
      fs.access(zstdBinPath, fs.R_OK | fs.X_OK, (err) => {
        if(err){
          if(callback) callback(new Error('Zstd binary is not executable.'));
          return;
        }
        cp.execFile(zstdBinPath, ['-f', '-d', inputFile, '-o', outputFile]
                               , (err, stdout, stderr) => {
          if(err){
            if(callback) callback(err);
            return;
          } else if(stdout){
            if(callback) callback(new Error(stdout));
            return;
          }
          if(callback) callback(null, outputFile);
        });
      });
    });
  });
}

function decompressionStreamFromFile(inputFile, callback){
  inputFile=path.resolve(inputFile);
  var eventEmitter = new events.EventEmitter();
  fs.access(inputFile, fs.R_OK, (err) => {
    if(err){
      if(callback) callback(new Error('Input file is not readable.'));
      return;
    }
    fs.access(zstdBinPath, fs.R_OK | fs.X_OK, (err) => {
      if(err){
        if(callback) callback(new Error('Zstd binary is not executable.'));
        return;
      }
      var proc=cp.spawn(zstdBinPath, ['-d', inputFile, '-c']);
      proc.stdout.on('data', (data) => {
        eventEmitter.emit('data', data);
      });
      proc.once('exit', (code, signal) => {
        if(code==0) eventEmitter.emit('end');
        else if(code==39) eventEmitter.emit('error', new Error('Not in zstd format'));
        else eventEmitter.emit('error', new Error('Unexpected stream close. Code '+code+'. Signal'+signal));
        proc.stdout.removeAllListeners('data');
        proc.removeAllListeners('error');
      });
      proc.once('error', (err) => {
        eventEmitter.emit('error', err);
        proc.stdout.removeAllListeners('data');
        proc.removeAllListeners('exit');
      });
      if(callback) callback(null, eventEmitter);
    });
  });
}

function decompressFileToStream(inputFile, writableStream, callback){
  inputFile=path.resolve(inputFile);
  var eventEmitter = new events.EventEmitter();
  fs.access(inputFile, fs.R_OK, (err) => {
    if(err){
      if(callback) callback(new Error('Input file is not readable.'));
      return;
    }
    fs.access(zstdBinPath, fs.R_OK | fs.X_OK, (err) => {
      if(err){
        if(callback) callback(new Error('Zstd binary is not executable.'));
        return;
      }
      var exitCode;
      var finished=false;
      var options=['-d', inputFile, '-c']
      var proc=cp.spawn(zstdBinPath, options);
      proc.stdout.pipe(writableStream);
      proc.on('exit', (code, signal) => {
        if(code==39) eventEmitter.emit('error', new Error('Not in zstd format'));
        else if(code!=0) eventEmitter.emit('error', new Error('Unexpected stream close. Code '+code+'. Signal '+signal));
        else exitCode=0;
        if(finished) eventEmitter.emit('finish');
        proc.removeAllListeners('error');
      });
      proc.on('error', (err) => {
        eventEmitter.emit('error', err);
        proc.removeAllListeners('exit');
      });
      writableStream.on('error', (err) => {
        eventEmitter.emit('error', err);
        proc.kill();
        writableStream.removeAllListeners('finish');
      });
      writableStream.on('finish', () => {
        finished=true;
        if(exitCode==0) eventEmitter.emit('finish');
        writableStream.removeAllListeners('error');
      });
      if(callback) callback(null, eventEmitter);
    });
  });
}

module.exports.compress=compress;
module.exports.compressFileToFile=compress;
module.exports.compressStreamToFile=compressStreamToFile;

module.exports.decompress=decompress;
module.exports.decompressFileToFile=decompress;
module.exports.decompressionStreamFromFile=decompressionStreamFromFile;
module.exports.decompressFileToStream=decompressFileToStream;