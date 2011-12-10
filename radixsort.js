// Based on http://stereopsis.com/radix.html
// Requires typed arrays.
(function(exports) {
  exports.sort = radixsort;

  var radixBits = 8,
      maxRadix = 1 << radixBits,
      histograms = radixsort._histograms = new Int32Array(maxRadix * 4);

  // TODO support negative and unsigned integers, and float 64.
  function radixsort() {
    function sort(array, sorted) {
      var n = array.length,
          input = new Uint32Array(array.buffer),
          inputBytes = new Uint8Array(input.buffer),
          sortedBytes = new Uint8Array((sorted = sorted || new Uint32Array(input.length)).buffer),
          passCount = array.BYTES_PER_ELEMENT,
          tmp,
          i,
          radixBits = 8;

      createHistograms(inputBytes, passCount);

      for (var pass=0; pass < passCount; pass++) {
        for (i=0; i<n; i++) {
          var x = inputBytes[i * passCount + pass],
              d = input[i];
          if (pass === 0) {
            if (inputBytes[(i + 1) * passCount - 1] >>> 7) {
              d ^= 0xffffffff;
              x ^= 0xff;
            } else {
              d ^= 0x80000000;
            }
          } else if (pass === passCount - 1) {
            d ^= (x >>> 7) ? 0x80000000 : 0xffffffff;
          }
          sorted[++histograms[(pass << radixBits) + x]] = d;
        }
        tmp = sorted;
        sorted = input;
        input = tmp;
        tmp = sortedBytes;
        sortedBytes = inputBytes;
        inputBytes = tmp;
      }
      return input.buffer;
    }

    return sort;
  }

  function createHistograms(inputBytes, passCount) {
    var i,
        j,
        id,
        sum,
        n = inputBytes.length;
    for (i = 0; i < maxRadix * passCount; i++) histograms[i] = 0;
    for (i = 0; i < n;) {
      // Check sign bit first.
      var x = inputBytes[i + passCount - 1],
          mask = (x >>> 7) ? (x ^= 0xff, 0xff) : (x |= 0x80, 0);
      histograms[((passCount - 1) << radixBits) + x]++;
      for (j = 0; j < passCount - 1; j++) {
        x = inputBytes[i++] ^ mask;
        histograms[(j << radixBits) + x]++;
      }
      i++;
    }
    for (j = 0; j < passCount; j++) {
      for (i = 0, id = j << radixBits, sum = 0; i < maxRadix; i++, id++) {
        var tsum = histograms[id] + sum;
        histograms[id] = sum - 1;
        sum = tsum;
      }
    }
  }
})(typeof exports !== "undefined" ? exports : this);
