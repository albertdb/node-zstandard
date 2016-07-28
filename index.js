var cp=require('child_process');
var fs=require('fs');
var path=require('path');
var zstdBin=(process.platform === 'win32')?'zstd.exe':'zstd';
var zstdBinPath=path.resolve(__dirname, zstdBin);

function compress(inputFile, outputFile, compLevel, callback){
  var args=[];
  for (var i=0; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  console.log(args);
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

module.exports.compress=compress;
module.exports.decompress=decompress;
