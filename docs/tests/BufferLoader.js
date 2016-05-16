function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = {};
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, name) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[name] = audioContext.createBufferSource();;
				loader.bufferList[name].buffer = buffer;
        if (++loader.loadCount == Object.keys(loader.urlList).length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < Object.keys(this.urlList).length; ++i)
	var name = Object.keys(this.urlList)[i];
	var url = this.urlList[name];
  this.loadBuffer(url, name);
}

